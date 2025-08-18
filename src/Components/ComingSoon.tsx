import React from "react";
import { Link } from "react-router-dom";
import "./ComingSoon.css";

const ComingSoon: React.FC = () => {
  return (
    <div className="coming-soon">
      <div className="coming-soon__content">
        <h1>🚀 Coming Soon!</h1>
        <p>This feature is under development and will be available soon.</p>
        <Link to="/" className="coming-soon__button">
          Back to Home
        </Link>
      </div>
    </div>
  );
};

export default ComingSoon;