import React from 'react';

interface ErrorStateProps {
  message: string;
}

const ErrorState: React.FC<ErrorStateProps> = ({ message }) => (
  <div className="flex flex-col items-center justify-center min-h-[200px] py-8 text-center">
    <div className="text-2xl text-red-500 mb-2">
      <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 inline-block mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12c0 4.97-4.03 9-9 9s-9-4.03-9-9 4.03-9 9-9 9 4.03 9 9z" /></svg>
      Error
    </div>
    <div className="text-gray-700 dark:text-gray-300 text-base max-w-md">
      {message}
    </div>
  </div>
);

export default ErrorState;
