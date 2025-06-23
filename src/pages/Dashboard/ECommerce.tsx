import React, { useState, useEffect } from 'react';
import { faTriangleExclamation, faXmark, faCircleCheck, faClock } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

interface Evaluation {
  _id: string;
  employeeId: string;
  employeeName: string;
  evaluatorRole: string;
  month: string; // Month as string ("6"), parse to number
  year: string;  // Year as string ("2025"), parse to number
}

interface EvaluationData {
  missingHR: boolean;
  missingAdmin: boolean;
  month: string;
  year: number;
}

export default function Ecommerce() {
  const [showPopup, setShowPopup] = useState(false);
  const [evaluationData, setEvaluationData] = useState<EvaluationData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // console.log(evaluationData);

  useEffect(() => {
    checkMonthlyEvaluations();
  }, []);

  const checkMonthlyEvaluations = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:5005/api/evaluations/read');
      const data = await response.json();

      const currentDate = new Date();
      const currentMonth = currentDate.getMonth(); // 0-based month
      const currentYear = currentDate.getFullYear();

      if ([1, 10, 20, 23, 25].includes(currentDate.getDate())) {
        const previousMonth = currentMonth === 0 ? 11 : currentMonth - 1;
        const previousYear = currentMonth === 0 ? currentYear - 1 : currentYear;

        const previousMonthData = data.data.filter((item: Evaluation) => {
          return (
            parseInt(item.month) === previousMonth + 1 && // API uses 1-based month
            parseInt(item.year) === previousYear
          );
        });

        const hrEvaluation = previousMonthData.find((item: Evaluation) => item.evaluatorRole === 'hr');
        const adminEvaluation = previousMonthData.find((item: Evaluation) => item.evaluatorRole === 'admin');

        if (!hrEvaluation || !adminEvaluation) {
          setEvaluationData({
            missingHR: !hrEvaluation,
            missingAdmin: !adminEvaluation,
            month: getMonthName(previousMonth),
            year: previousYear,
          });
          setShowPopup(true);
        }
      }
    } catch (error) {
      console.error('Error checking evaluations:', error);
    } finally {
      setLoading(false);
    }
  };

  const getMonthName = (monthIndex: number): string => {
    const months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    return months[monthIndex];
  };

  const handleRemindLater = () => {
    setShowPopup(false);
  };

  const handleGoToEvaluation = () => {
    setShowPopup(false);
    window.location.href = '/increment';
  };

  const handleClosePopup = () => {
    setShowPopup(false);
  };

  return (
    <>
      {showPopup && evaluationData && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-99999 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full transform transition-all duration-300 scale-100 ">
            {/* Header */}
            <div className="bg-[#0777ab] text-white px-6 py-4 rounded-t-2xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <FontAwesomeIcon icon={faTriangleExclamation} className="w-6 h-6 text-white" />
                  <h3 className="text-lg font-semibold tracking-wide">Evaluation Reminder</h3>
                </div>
                <button
                  onClick={handleClosePopup}
                  className="text-white hover:text-gray-200 transition-colors"
                >
                  <FontAwesomeIcon icon={faXmark} className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Body */}
            <div className="p-6 space-y-5">
              <p className="text-gray-800 text-base">
                Monthly evaluation is pending for{" "}
                <strong>{evaluationData.month} {evaluationData.year}</strong>
              </p>

              {/* Missing Evaluations */}
              <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3">
                <h4 className="text-sm font-semibold text-red-800 mb-2">Missing Evaluations:</h4>
                <ul className="space-y-1 text-sm text-red-700">
                  {evaluationData.missingHR && (
                    <li className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                      <span>HR Evaluation</span>
                    </li>
                  )}
                  {evaluationData.missingAdmin && (
                    <li className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                      <span>Admin Evaluation</span>
                    </li>
                  )}
                </ul>
              </div>

              <p className="text-sm text-gray-500">
                Please complete the missing evaluations to ensure proper monthly reporting.
              </p>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-1">
                <button
                  onClick={handleGoToEvaluation}
                  className="flex-1 flex items-center justify-center gap-2 bg-[#0777ab] text-white py-2 px-4 rounded-lg font-medium transition-colors"
                >
                  <FontAwesomeIcon icon={faCircleCheck} className="w-4 h-4" />
                  <span>Go to Evaluations</span>
                </button>
                <button
                  onClick={handleRemindLater}
                  className="flex-1 flex items-center justify-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 px-4 rounded-lg font-medium transition-colors"
                >
                  <FontAwesomeIcon icon={faClock} className="w-4 h-4" />
                  <span>Remind Later</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
