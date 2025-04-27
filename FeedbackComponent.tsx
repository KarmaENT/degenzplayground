import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FaStar, FaRegStar, FaThumbsUp, FaThumbsDown, FaComment } from 'react-icons/fa';

interface FeedbackProps {
  messageId: number;
  sessionId: number;
  agentId: number;
  agentName: string;
}

const FeedbackComponent: React.FC<FeedbackProps> = ({ messageId, sessionId, agentId, agentName }) => {
  const [feedbackType, setFeedbackType] = useState<string>('rating');
  const [category, setCategory] = useState<string>('overall');
  const [rating, setRating] = useState<number | null>(null);
  const [isPositive, setIsPositive] = useState<boolean | null>(null);
  const [comment, setComment] = useState<string>('');
  const [showCommentBox, setShowCommentBox] = useState<boolean>(false);
  const [feedbackSubmitted, setFeedbackSubmitted] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleRatingClick = (value: number) => {
    setRating(value);
    setFeedbackType('rating');
    setIsPositive(null);
  };

  const handleThumbsClick = (value: boolean) => {
    setIsPositive(value);
    setFeedbackType('thumbs');
    setRating(null);
  };

  const handleCommentClick = () => {
    setShowCommentBox(!showCommentBox);
    if (showCommentBox) {
      setFeedbackType(rating !== null ? 'rating' : isPositive !== null ? 'thumbs' : 'detailed');
    } else {
      setFeedbackType('detailed');
    }
  };

  const handleSubmit = async () => {
    try {
      setError(null);
      
      // Validate that some form of feedback is provided
      if (rating === null && isPositive === null && (!comment || comment.trim() === '')) {
        setError('Please provide some feedback before submitting');
        return;
      }
      
      const feedbackData = {
        message_id: messageId,
        session_id: sessionId,
        agent_id: agentId,
        feedback_type: feedbackType,
        category: category,
        rating: rating,
        is_positive: isPositive,
        comment: comment.trim() !== '' ? comment : null
      };
      
      await axios.post('/api/feedback/', feedbackData);
      setFeedbackSubmitted(true);
    } catch (err) {
      setError('Failed to submit feedback. Please try again.');
      console.error('Error submitting feedback:', err);
    }
  };

  if (feedbackSubmitted) {
    return (
      <div className="feedback-container submitted">
        <p className="text-green-500">Thank you for your feedback!</p>
      </div>
    );
  }

  return (
    <div className="feedback-container bg-gray-800 p-3 rounded-lg mt-2">
      <div className="flex justify-between items-center mb-2">
        <h4 className="text-sm font-semibold">Rate {agentName}'s response:</h4>
        <div className="flex space-x-2">
          <select 
            className="bg-gray-700 text-white text-xs rounded px-2 py-1"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            <option value="overall">Overall</option>
            <option value="accuracy">Accuracy</option>
            <option value="helpfulness">Helpfulness</option>
            <option value="creativity">Creativity</option>
            <option value="clarity">Clarity</option>
            <option value="speed">Speed</option>
          </select>
        </div>
      </div>
      
      {error && (
        <div className="text-red-500 text-xs mb-2">{error}</div>
      )}
      
      <div className="flex justify-between items-center">
        <div className="star-rating flex space-x-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              onClick={() => handleRatingClick(star)}
              className="focus:outline-none"
            >
              {rating !== null && star <= rating ? (
                <FaStar className="text-yellow-400" />
              ) : (
                <FaRegStar className="text-gray-400 hover:text-yellow-400" />
              )}
            </button>
          ))}
        </div>
        
        <div className="thumbs flex space-x-3">
          <button
            onClick={() => handleThumbsClick(true)}
            className={`focus:outline-none ${isPositive === true ? 'text-green-500' : 'text-gray-400 hover:text-green-500'}`}
          >
            <FaThumbsUp />
          </button>
          <button
            onClick={() => handleThumbsClick(false)}
            className={`focus:outline-none ${isPositive === false ? 'text-red-500' : 'text-gray-400 hover:text-red-500'}`}
          >
            <FaThumbsDown />
          </button>
          <button
            onClick={handleCommentClick}
            className={`focus:outline-none ${showCommentBox ? 'text-blue-500' : 'text-gray-400 hover:text-blue-500'}`}
          >
            <FaComment />
          </button>
        </div>
      </div>
      
      {showCommentBox && (
        <div className="mt-2">
          <textarea
            className="w-full bg-gray-700 text-white rounded p-2 text-sm"
            rows={3}
            placeholder="Add detailed feedback..."
            value={comment}
            onChange={(e) => setComment(e.target.value)}
          />
        </div>
      )}
      
      <div className="mt-2 flex justify-end">
        <button
          className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold py-1 px-3 rounded"
          onClick={handleSubmit}
        >
          Submit Feedback
        </button>
      </div>
    </div>
  );
};

export default FeedbackComponent;
