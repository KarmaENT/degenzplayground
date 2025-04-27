"""
Services for Advanced Prompt Engineering Tools
"""

import json
import time
import logging
from typing import List, Dict, Any, Optional
from datetime import datetime
from sqlalchemy.orm import Session
from fastapi import HTTPException

from app.models.prompt_models import (
    PromptTemplate,
    PromptTag,
    PromptChain,
    PromptTestResult,
    ChainTestResult,
    PromptUsageAnalytics,
    ChainUsageAnalytics,
    PromptLibraryItem,
    PromptLibraryReview
)
from app.services.ai.unified_service import UnifiedAIService

# Initialize logging
logger = logging.getLogger(__name__)

# Initialize AI service
ai_service = UnifiedAIService()

class PromptTemplateService:
    """Service for managing prompt templates."""
    
    @staticmethod
    async def create_template(
        db: Session,
        title: str,
        template_text: str,
        creator_id: int,
        description: Optional[str] = None,
        variables: Optional[List[Dict[str, str]]] = None,
        default_values: Optional[Dict[str, str]] = None,
        is_public: bool = False,
        tag_ids: Optional[List[int]] = None
    ) -> PromptTemplate:
        """Create a new prompt template."""
        # Extract variables from template if not provided
        if variables is None:
            variables = PromptTemplateService._extract_variables(template_text)
        
        # Create template
        template = PromptTemplate(
            title=title,
            description=description,
            template_text=template_text,
            variables=variables,
            default_values=default_values or {},
            is_public=is_public,
            creator_id=creator_id
        )
        
        db.add(template)
        db.commit()
        
        # Add tags if provided
        if tag_ids:
            tags = db.query(PromptTag).filter(PromptTag.id.in_(tag_ids)).all()
            template.tags = tags
            db.commit()
            
        db.refresh(template)
        return template
    
    @staticmethod
    def _extract_variables(template_text: str) -> List[Dict[str, str]]:
        """Extract variables from a template string."""
        import re
        
        # Look for patterns like {{variable_name}} or {variable_name}
        pattern = r'\{\{([^}]+)\}\}|\{([^}]+)\}'
        matches = re.findall(pattern, template_text)
        
        variables = []
        seen_vars = set()
        
        for match in matches:
            # Each match is a tuple with one empty string and one variable name
            var_name = match[0] if match[0] else match[1]
            
            # Skip duplicates
            if var_name in seen_vars:
                continue
                
            seen_vars.add(var_name)
            variables.append({
                "name": var_name,
                "description": f"Value for {var_name}",
                "type": "string"
            })
            
        return variables
    
    @staticmethod
    async def get_templates(
        db: Session,
        user_id: int,
        include_public: bool = True,
        tag_ids: Optional[List[int]] = None
    ) -> List[PromptTemplate]:
        """Get all templates accessible by a user."""
        query = db.query(PromptTemplate).filter(PromptTemplate.creator_id == user_id)
        
        if include_public:
            query = query.union(
                db.query(PromptTemplate).filter(PromptTemplate.is_public == True)
            )
            
        # Filter by tags if specified
        if tag_ids:
            for tag_id in tag_ids:
                query = query.filter(PromptTemplate.tags.any(id=tag_id))
                
        return query.all()
    
    @staticmethod
    async def get_template(
        db: Session,
        template_id: int,
        user_id: int
    ) -> Optional[PromptTemplate]:
        """Get a specific template if accessible by the user."""
        template = db.query(PromptTemplate).filter(PromptTemplate.id == template_id).first()
        
        if not template:
            return None
            
        # Check if user has access
        if template.creator_id == user_id or template.is_public:
            return template
            
        return None
    
    @staticmethod
    async def update_template(
        db: Session,
        template_id: int,
        user_id: int,
        title: Optional[str] = None,
        description: Optional[str] = None,
        template_text: Optional[str] = None,
        variables: Optional[List[Dict[str, str]]] = None,
        default_values: Optional[Dict[str, str]] = None,
        is_public: Optional[bool] = None,
        tag_ids: Optional[List[int]] = None
    ) -> PromptTemplate:
        """Update a prompt template."""
        template = db.query(PromptTemplate).filter(
            PromptTemplate.id == template_id,
            PromptTemplate.creator_id == user_id
        ).first()
        
        if not template:
            raise HTTPException(status_code=404, detail="Template not found or you don't have permission")
        
        # Update fields if provided
        if title is not None:
            template.title = title
        if description is not None:
            template.description = description
        if template_text is not None:
            template.template_text = template_text
            # Re-extract variables if not provided
            if variables is None:
                template.variables = PromptTemplateService._extract_variables(template_text)
        if variables is not None:
            template.variables = variables
        if default_values is not None:
            template.default_values = default_values
        if is_public is not None:
            template.is_public = is_public
            
        # Update tags if provided
        if tag_ids is not None:
            tags = db.query(PromptTag).filter(PromptTag.id.in_(tag_ids)).all()
            template.tags = tags
            
        db.commit()
        db.refresh(template)
        return template
    
    @staticmethod
    async def delete_template(
        db: Session,
        template_id: int,
        user_id: int
    ) -> bool:
        """Delete a prompt template."""
        template = db.query(PromptTemplate).filter(
            PromptTemplate.id == template_id,
            PromptTemplate.creator_id == user_id
        ).first()
        
        if not template:
            raise HTTPException(status_code=404, detail="Template not found or you don't have permission")
        
        db.delete(template)
        db.commit()
        return True
    
    @staticmethod
    async def render_template(
        template: PromptTemplate,
        variables: Dict[str, str]
    ) -> str:
        """Render a prompt template with the provided variables."""
        rendered_text = template.template_text
        
        # Replace variables in the template
        for var in template.variables:
            var_name = var["name"]
            placeholder = f"{{{{{var_name}}}}}" if "{{" in template.template_text else f"{{{var_name}}}"
            value = variables.get(var_name, template.default_values.get(var_name, f"[{var_name}]"))
            rendered_text = rendered_text.replace(placeholder, value)
            
        return rendered_text
    
    @staticmethod
    async def test_template(
        db: Session,
        template_id: int,
        user_id: int,
        variables: Dict[str, str],
        model: str,
        parameters: Dict[str, Any]
    ) -> PromptTestResult:
        """Test a prompt template with the provided variables and model."""
        # Get template
        template = await PromptTemplateService.get_template(db, template_id, user_id)
        if not template:
            raise HTTPException(status_code=404, detail="Template not found or you don't have permission")
        
        # Render template
        prompt_text = await PromptTemplateService.render_template(template, variables)
        
        # Generate response using AI service
        start_time = time.time()
        try:
            response = ai_service.generate_text(
                prompt=prompt_text,
                model=model,
                **parameters
            )
            success = True
        except Exception as e:
            logger.error(f"Error generating response: {e}")
            response = {"text": f"Error: {str(e)}"}
            success = False
            
        execution_time = time.time() - start_time
        
        # Create test result
        test_result = PromptTestResult(
            template_id=template_id,
            user_id=user_id,
            model=model,
            parameters=parameters,
            variables_used=variables,
            prompt_text=prompt_text,
            response_text=response.get("text", ""),
            execution_time=execution_time,
            rating=None,  # To be set by user later
            notes=None    # To be set by user later
        )
        
        db.add(test_result)
        db.commit()
        db.refresh(test_result)
        
        # Record usage analytics
        await PromptAnalyticsService.record_template_usage(
            db=db,
            template_id=template_id,
            user_id=user_id,
            agent_id=None,
            session_id=None,
            model=model,
            parameters=parameters,
            variables_used=variables,
            execution_time=execution_time,
            token_count=response.get("token_count", 0),
            success=success
        )
        
        return test_result
    
    @staticmethod
    async def rate_test_result(
        db: Session,
        test_result_id: int,
        user_id: int,
        rating: int,
        notes: Optional[str] = None
    ) -> PromptTestResult:
        """Rate a prompt test result."""
        test_result = db.query(PromptTestResult).filter(
            PromptTestResult.id == test_result_id,
            PromptTestResult.user_id == user_id
        ).first()
        
        if not test_result:
            raise HTTPException(status_code=404, detail="Test result not found or you don't have permission")
        
        test_result.rating = rating
        test_result.notes = notes
        
        db.commit()
        db.refresh(test_result)
        return test_result


class PromptChainService:
    """Service for managing prompt chains."""
    
    @staticmethod
    async def create_chain(
        db: Session,
        title: str,
        creator_id: int,
        description: Optional[str] = None,
        template_ids: Optional[List[int]] = None,
        is_public: bool = False
    ) -> PromptChain:
        """Create a new prompt chain."""
        chain = PromptChain(
            title=title,
            description=description,
            is_public=is_public,
            creator_id=creator_id
        )
        
        db.add(chain)
        db.commit()
        
        # Add templates if provided
        if template_ids:
            templates = db.query(PromptTemplate).filter(PromptTemplate.id.in_(template_ids)).all()
            
            # Check if user has access to all templates
            for template in templates:
                if template.creator_id != creator_id and not template.is_public:
                    raise HTTPException(status_code=403, detail=f"You don't have access to template: {template.title}")
            
            # Add templates to chain with order
            for i, template_id in enumerate(template_ids):
                # Find the template in our list
                template = next((t for t in templates if t.id == template_id), None)
                if template:
                    # Add to association table with order
                    db.execute(
                        "INSERT INTO prompt_chain_templates (prompt_chain_id, prompt_template_id, order_index) VALUES (:chain_id, :template_id, :order_index)",
                        {
                            "chain_id": chain.id,
                            "template_id": template_id,
                            "order_index": i
                        }
                    )
            
            db.commit()
            
        db.refresh(chain)
        return chain
    
    @staticmethod
    async def get_chains(
        db: Session,
        user_id: int,
        include_public: bool = True
    ) -> List[PromptChain]:
        """Get all chains accessible by a user."""
        query = db.query(PromptChain).filter(PromptChain.creator_id == user_id)
        
        if include_public:
            query = query.union(
                db.query(PromptChain).filter(PromptChain.is_public == True)
            )
                
        return query.all()
    
    @staticmethod
    async def get_chain(
        db: Session,
        chain_id: int,
        user_id: int
    ) -> Optional[PromptChain]:
        """Get a specific chain if accessible by the user."""
        chain = db.query(PromptChain).filter(PromptChain.id == chain_id).first()
        
        if not chain:
            return None
            
        # Check if user has access
        if chain.creator_id == user_id or chain.is_public:
            return chain
            
        return None
    
    @staticmethod
    async def update_chain(
        db: Session,
        chain_id: int,
        user_id: int,
        title: Optional[str] = None,
        description: Optional[str] = None,
        template_ids: Optional[List[int]] = None,
        is_public: Optional[bool] = None
    ) -> PromptChain:
        """Update a prompt chain."""
        chain = db.query(PromptChain).filter(
            PromptChain.id == chain_id,
            PromptChain.creator_id == user_id
        ).first()
        
        if not chain:
            raise HTTPException(status_code=404, detail="Chain not found or you don't have permission")
        
        # Update fields if provided
        if title is not None:
            chain.title = title
        if description is not None:
            chain.description = description
        if is_public is not None:
            chain.is_public = is_public
            
        # Update templates if provided
        if template_ids is not None:
            # Clear existing templates
            db.execute(
                "DELETE FROM prompt_chain_templates WHERE prompt_chain_id = :chain_id",
                {"chain_id": chain.id}
            )
            
            # Add new templates
            templates = db.query(PromptTemplate).filter(PromptTemplate.id.in_(template_ids)).all()
            
            # Check if user has access to all templates
            for template in templates:
                if template.creator_id != user_id and not template.is_public:
                    raise HTTPException(status_code=403, detail=f"You don't have access to template: {template.title}")
            
            # Add templates to chain with order
            for i, template_id in enumerate(template_ids):
                # Find the template in our list
                template = next((t for t in templates if t.id == template_id), None)
                if template:
                    # Add to association table with order
                    db.execute(
                        "INSERT INTO prompt_chain_templates (prompt_chain_id, prompt_template_id, order_index) VALUES (:chain_id, :template_id, :order_index)",
                        {
                            "chain_id": chain.id,
                            "template_id": template_id,
                            "order_index": i
                        }
                    )
            
        db.commit()
        db.refresh(chain)
        return chain
    
    @staticmethod
    async def delete_chain(
        db: Session,
        chain_id: int,
        user_id: int
    ) -> bool:
        """Delete a prompt chain."""
        chain = db.query(PromptChain).filter(
            PromptChain.id == chain_id,
            PromptChain.creator_i
(Content truncated due to size limit. Use line ranges to read in chunks)