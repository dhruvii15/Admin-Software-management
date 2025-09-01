import React, { useState, useEffect } from 'react';
import { faTriangleExclamation, faXmark, faCircleCheck, faClock, faCalendarDays, faUserTie } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import Dashboard from './Dashboard';
import DashWeb from './WebSite';
import axios from 'axios';

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
  month: string;
  year: number;
}

interface Leave {
  _id: string;
  employeeId: string;
  name: string;
  startDate: string;
  endDate: string;
  reason: string;
  status: string;
}

interface LeaveData {
  _id: string;
  name: string;
  startDate: string;
  endDate: string;
  reason: string;
}

interface Interview {
  _id: string;
  name: string;
  position: string;
  phonenumber: string;
  interviewdate: string;
  remark: string;
  experience: string;
  reference: string;
  status: string;
  resume: string;
}

interface InterviewData {
  _id: string;
  name: string;
  position: string;
  interviewdate: string;
  phonenumber: string;
}

export default function Ecommerce() {
  const [showPopup, setShowPopup] = useState(false);
  const [showLeavePopup, setShowLeavePopup] = useState(false);
  const [showInterviewPopup, setShowInterviewPopup] = useState(false);
  const [evaluationData, setEvaluationData] = useState<EvaluationData | null>(null);
  const [leaveData, setLeaveData] = useState<LeaveData[]>([]);
  const [interviewData, setInterviewData] = useState<InterviewData[]>([]);

  console.log(interviewData);


  useEffect(() => {
    checkMonthlyEvaluations();
    checkTomorrowLeaves();
    checkTomorrowInterviews();
  }, []);

  const checkTomorrowInterviews = async () => {
    try {
      // Check if interview popup has already been shown today
      const today = new Date().toDateString();
      const interviewPopupShownKey = `interviewPopupShown_${today}`;
      const hasInterviewPopupBeenShown = sessionStorage.getItem(interviewPopupShownKey);

      if (hasInterviewPopupBeenShown) {
        return;
      }

      const response = await fetch('https://api.pslink.world/api/plexus/hiringresume/read');
      const data = await response.json();

      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowDateString = tomorrow.toISOString().split('T')[0]; // Format: YYYY-MM-DD

      // Filter interviews that are scheduled for tomorrow
      const tomorrowInterviews = data.data.filter((interview: Interview) => {
        if (!interview.interviewdate) return false; // Skip if no date provided

        const interviewDateObj = new Date(interview.interviewdate);
        if (isNaN(interviewDateObj.getTime())) return false; // Skip invalid dates

        const interviewDate = interviewDateObj.toISOString().split('T')[0];

        console.log(interviewDate === tomorrowDateString);
        return interviewDate === tomorrowDateString;
      });

      console.log(tomorrowInterviews);


      if (tomorrowInterviews.length > 0) {
        const interviewsInfo = tomorrowInterviews.map((interview: Interview) => ({
          _id: interview._id,
          name: interview.name,
          position: interview.position,
          interviewdate: interview.interviewdate,
          phonenumber: interview.phonenumber
        }));

        console.log(interviewsInfo);

        setInterviewData(interviewsInfo);
        setShowInterviewPopup(true);

        // Mark interview popup as shown for today
        sessionStorage.setItem(interviewPopupShownKey, 'true');
      }
    } catch (error) {
      console.error('Error checking tomorrow interviews:', error);
    }
  };

  const checkTomorrowLeaves = async () => {
    try {
      // Check if leave popup has already been shown today
      const today = new Date().toDateString();
      const leavePopupShownKey = `leavePopupShown_${today}`;
      const hasLeavePopupBeenShown = sessionStorage.getItem(leavePopupShownKey);

      if (hasLeavePopupBeenShown) {
        return;
      }

      const response = await fetch('https://api.pslink.world/api/plexus/leave/read');
      const data = await response.json();

      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowDateString = tomorrow.toISOString().split('T')[0]; // Format: YYYY-MM-DD

      // Filter leaves that start tomorrow
      const tomorrowLeaves = data.data.filter((leave: Leave) => {
        const leaveStartDate = new Date(leave.startDate).toISOString().split('T')[0];
        return leaveStartDate === tomorrowDateString;
      });

      if (tomorrowLeaves.length > 0) {
        const leavesInfo = tomorrowLeaves.map((leave: Leave) => ({
          _id: leave._id,
          name: leave.name,
          startDate: leave.startDate,
          endDate: leave.endDate,
          reason: leave.reason
        }));

        setLeaveData(leavesInfo);
        setShowLeavePopup(true);

        // Mark leave popup as shown for today
        sessionStorage.setItem(leavePopupShownKey, 'true');
      }
    } catch (error) {
      console.error('Error checking tomorrow leaves:', error);
    }
  };

  const checkMonthlyEvaluations = async () => {
    try {

      // Check if popup has already been shown this session
      const popupShownKey = 'evaluationPopupShown';
      const hasPopupBeenShown = sessionStorage.getItem(popupShownKey);

      if (hasPopupBeenShown) {
        return;
      }

      const response = await fetch('https://api.pslink.world/api/plexus/evaluations/read');
      const data = await response.json();

      const currentDate = new Date();
      const currentMonth = currentDate.getMonth(); // 0-based month
      const currentYear = currentDate.getFullYear();

      if ([1, 10, 20, 23, 25, 26].includes(currentDate.getDate())) {
        const previousMonth = currentMonth === 0 ? 11 : currentMonth - 1;
        const previousYear = currentMonth === 0 ? currentYear - 1 : currentYear;

        const previousMonthData = data.data.filter((item: Evaluation) => {
          return (
            parseInt(item.month) === previousMonth + 1 && // API uses 1-based month
            parseInt(item.year) === previousYear
          );
        });

        const hrEvaluation = previousMonthData.find((item: Evaluation) => item.evaluatorRole === 'hr');

        if (!hrEvaluation) {
          setEvaluationData({
            missingHR: !hrEvaluation,
            month: getMonthName(previousMonth),
            year: previousYear,
          });
          setShowPopup(true);

          // Mark popup as shown for this session
          sessionStorage.setItem(popupShownKey, 'true');
        }
      }
    } catch (error) {
      console.error('Error checking evaluations:', error);
    }
  };

  const getMonthName = (monthIndex: number): string => {
    const months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    return months[monthIndex];
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const formatDateTime = (dateTimeString: string): string => {
    const date = new Date(dateTimeString);
    return date.toLocaleString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
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

  const handleCloseLeavePopup = async () => {
    // try {
    //   // Extract all leave IDs
    //   const leaveIds = leaveData.map(leave => leave._id);


    //   // Call delete API with array of IDs
    //   const response = await axios.delete(`https://api.pslink.world/api/plexus/leave/multy`, {
    //     data: { ids: leaveIds }
    //   });

    //   if (response.status === 200) {
    //     console.log('Leaves acknowledged and deleted successfully');
    //     setShowLeavePopup(false);
    //     setLeaveData([]);
    //   } else {
    //     console.error('Failed to delete leaves');
    //     setShowLeavePopup(false);
    //   }
    // } catch (error) {
    //   console.error('Error deleting leaves:', error);
    //   // Still close the popup even if delete fails
    //   setShowLeavePopup(false);
    // }

    setShowLeavePopup(false);
  };

  const handleLeaveRemindLater = () => {
    setShowLeavePopup(false);
  };

  const handleCloseInterviewPopup = () => {
    setShowInterviewPopup(false);
    setInterviewData([]);
  };

  const handleInterviewRemindLater = () => {
    setShowInterviewPopup(false);
  };

  return (
    <>
      <DashWeb />

      {/* Evaluation Popup */}
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

      {/* Leave Reminder Popup */}
      {showLeavePopup && leaveData.length > 0 && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-99999 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full transform transition-all duration-300 scale-100 max-h-[80vh] overflow-y-auto">
            {/* Header */}
            <div className="bg-[#10b981] text-white px-6 py-4 rounded-t-2xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <FontAwesomeIcon icon={faCalendarDays} className="w-6 h-6 text-white" />
                  <h3 className="text-lg font-semibold tracking-wide">Tomorrow's Leave Reminder</h3>
                </div>
                <button
                  onClick={handleCloseLeavePopup}
                  className="text-white hover:text-gray-200 transition-colors"
                >
                  <FontAwesomeIcon icon={faXmark} className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Body */}
            <div className="p-6 space-y-5">
              <p className="text-gray-800 text-base">
                The following employee{leaveData.length > 1 ? 's have' : ' has'} leave scheduled for tomorrow:
              </p>

              {/* Leave Details */}
              <div className="space-y-4">
                {leaveData.map((leave, index) => (
                  <div key={index} className="bg-green-50 border border-green-200 rounded-xl px-4 py-3">
                    <div className="space-y-2">
                      <h4 className="text-sm font-semibold text-green-800">
                        {leave.name}
                      </h4>
                      <div className="text-sm text-green-700 space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">Start Date:</span>
                          <span>{formatDate(leave.startDate)}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">End Date:</span>
                          <span>{leave.endDate ? formatDate(leave.endDate) : '-'}</span>
                        </div>
                        <div className="flex items-start gap-2">
                          <span className="font-medium">Reason:</span>
                          <span>{leave.reason}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-1">
                <button
                  onClick={handleCloseLeavePopup}
                  className="flex-1 flex items-center justify-center gap-2 bg-[#10b981] text-white py-2 px-4 rounded-lg font-medium transition-colors"
                >
                  <FontAwesomeIcon icon={faCircleCheck} className="w-4 h-4" />
                  <span>Acknowledged</span>
                </button>
                <button
                  onClick={handleLeaveRemindLater}
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

      {/* Interview Reminder Popup */}
      {showInterviewPopup && interviewData.length > 0 && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-99999 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full transform transition-all duration-300 scale-100 max-h-[80vh] overflow-y-auto">
            {/* Header */}
            <div className="bg-[#f59e0b] text-white px-6 py-4 rounded-t-2xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <FontAwesomeIcon icon={faUserTie} className="w-6 h-6 text-white" />
                  <h3 className="text-lg font-semibold tracking-wide">Tomorrow's Interview Reminder</h3>
                </div>
                <button
                  onClick={handleCloseInterviewPopup}
                  className="text-white hover:text-gray-200 transition-colors"
                >
                  <FontAwesomeIcon icon={faXmark} className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Body */}
            <div className="p-6 space-y-5">
              <p className="text-gray-800 text-base">
                The following interview{interviewData.length > 1 ? 's are' : ' is'} scheduled for tomorrow:
              </p>

              {/* Interview Details */}
              <div className="space-y-4">
                {interviewData.map((interview, index) => (
                  <div key={index} className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
                    <div className="space-y-2">
                      <h4 className="text-sm font-semibold text-amber-800">
                        {interview.name}
                      </h4>
                      <div className="text-sm text-amber-700 space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">Position:</span>
                          <span>{interview.position}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">Date & Time:</span>
                          <span>{formatDateTime(interview.interviewdate)}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">Phone:</span>
                          <span>{interview.phonenumber}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-1">
                <button
                  onClick={handleCloseInterviewPopup}
                  className="flex-1 flex items-center justify-center gap-2 bg-[#f59e0b] text-white py-2 px-4 rounded-lg font-medium transition-colors"
                >
                  <FontAwesomeIcon icon={faCircleCheck} className="w-4 h-4" />
                  <span>Acknowledged</span>
                </button>
                <button
                  onClick={handleInterviewRemindLater}
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