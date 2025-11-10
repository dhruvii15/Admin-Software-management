import React, { useState, useEffect } from "react";
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faUser,
    faCalendar,
    faBriefcase,
    faAward,
    faClock,
    faUserCheck,
    faChartLine,
    faExclamationTriangle,
} from '@fortawesome/free-solid-svg-icons';

const Evaluations = () => {
    const [employees, setEmployees] = useState([]);
    const [evaluations, setEvaluations] = useState([]);
    const [loading, setLoading] = useState(false);
    const [evaluationsLoading, setEvaluationsLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [selectedEmployee, setSelectedEmployee] = useState('');
    const [existingEvaluationData, setExistingEvaluationData] = useState(null);

    // Function to get previous month and year
    const getPreviousMonthAndYear = () => {
        const currentDate = new Date();
        const previousMonth = currentDate.getMonth(); // getMonth() returns 0-11, so current month - 1 gives us previous month
        const currentYear = currentDate.getFullYear();

        // If current month is January (0), previous month should be December (12) of previous year
        if (previousMonth === 0) {
            return { month: 12, year: currentYear - 1 };
        }

        return { month: previousMonth, year: currentYear };
    };

    const { month: defaultMonth, year: defaultYear } = getPreviousMonthAndYear();

    const [evaluationData, setEvaluationData] = useState({
        employeeId: '',
        employeeName: '',
        month: defaultMonth,
        year: defaultYear,
        grades: {
            work: '',
            speed: '',
            // overall: '',
            leave: '',
            time: '',
            behaviour: ''
        },
        notes: ''
    });

    const months = [
        { value: 1, label: 'January' },
        { value: 2, label: 'February' },
        { value: 3, label: 'March' },
        { value: 4, label: 'April' },
        { value: 5, label: 'May' },
        { value: 6, label: 'June' },
        { value: 7, label: 'July' },
        { value: 8, label: 'August' },
        { value: 9, label: 'September' },
        { value: 10, label: 'October' },
        { value: 11, label: 'November' },
        { value: 12, label: 'December' }
    ];

    const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i);

    const gradeOptions = [
        { value: 'A', label: 'A - Excellent (75-100%)', points: 4.0, color: 'bg-green-500', bgColor: 'bg-green-50' },
        { value: 'B', label: 'B - Good (74-50%)', points: 3.0, color: 'bg-blue-500', bgColor: 'bg-blue-50' },
        { value: 'C', label: 'C - Average (49-25%)', points: 2.0, color: 'bg-yellow-500', bgColor: 'bg-yellow-50' },
        { value: 'D', label: 'D - Below Average (Below 24%)', points: 1.0, color: 'bg-red-500', bgColor: 'bg-red-50' }
    ];

    const gradeLabels = {
        work: { icon: faBriefcase, label: 'Work Performance', name : 'Vrushabh sir', color: 'text-blue-600' },
        speed: { icon: faBriefcase, label: 'Work Speed & Efficiency',name : 'Vrushabh sir', color: 'text-indigo-600' },
        // overall: { icon: faTarget, label: 'Overall Performance', color: 'text-emerald-600' },
        leave: { icon: faCalendar, label: 'Leave Management', name : 'HR',color: 'text-green-600' },
        time: { icon: faClock, label: 'Time Management', name : 'HR',color: 'text-purple-600' },
        behaviour: { icon: faUserCheck, label: 'Behaviour & Attitude', name : 'HR',color: 'text-orange-600' }
    };

    useEffect(() => {
        // First fetch evaluations, then fetch employees
        const initializeData = async () => {
            await fetchEvaluations();
            await fetchEmployees();
        };
        initializeData();
    }, []);

    const fetchEmployees = async () => {
        setLoading(true);
        try {
            const response = await fetch('http://localhost:5004/api/plexus/employee/read');
            if (response.ok) {
                const data = await response.json();
                setEmployees(data.data || []);
            } else {
                toast.error('Failed to fetch employees');
            }
        } catch (error) {
            toast.error('Error fetching employees: ' + error.message);
        } finally {
            setLoading(false);
        }
    };
    const handleNotesChange = (e) => {
        setEvaluationData(prev => ({
            ...prev,
            notes: e.target.value
        }));
    };


    const fetchEvaluations = async () => {
        setEvaluationsLoading(true);
        try {
            const response = await fetch('http://localhost:5004/api/plexus/evaluations/read');
            if (response.ok) {
                const data = await response.json();
                setEvaluations(data.data || []);
            } else {
                console.error('Failed to fetch evaluations');
            }
        } catch (error) {
            console.error('Error fetching evaluations:', error);
        } finally {
            setEvaluationsLoading(false);
        }
    };

    const checkExistingEvaluation = (employeeId, month, year) => {
        if (!employeeId || !month || !year) return null;

        const existing = evaluations.find(e => {
            const employeeMatch = (e.employeeId === employeeId || e.employeeId === employeeId.toString());
            const monthMatch = parseInt(e.month) === parseInt(month);
            const yearMatch = parseInt(e.year) === parseInt(year);

            return employeeMatch && monthMatch && yearMatch;
        });

        return existing;
    };

    const handleEmployeeSelect = (employeeId) => {
        if (!employeeId) {
            setSelectedEmployee('');
            setExistingEvaluationData(null);
            setEvaluationData(prev => ({
                ...prev,
                employeeId: '',
                employeeName: ''
            }));
            return;
        }

        const employee = employees.find(emp => (emp.id || emp._id) === employeeId);
        setSelectedEmployee(employeeId);

        // Check for existing evaluation immediately
        const existing = checkExistingEvaluation(
            employeeId,
            evaluationData.month,
            evaluationData.year
        );

        setExistingEvaluationData(existing);

        const employeeName = employee ?
            (employee.name || employee.fullName || `${employee.firstName || ''} ${employee.lastName || ''}`.trim())
            : '';

        setEvaluationData(prev => ({
            ...prev,
            employeeId,
            employeeName
        }));

        // Show toast if evaluation already exists
        if (existing) {
            const monthName = months.find(m => m.value === evaluationData.month)?.label || 'Unknown Month';
            toast.warning(
                `Note: Evaluation already exists for ${employeeName} for ${monthName} ${evaluationData.year}`,
                { autoClose: 3000 }
            );
        }
    };

    const handleMonthYearChange = (field, value) => {
        if (!value) return;

        const newData = { ...evaluationData, [field]: parseInt(value) };
        setEvaluationData(newData);

        if (selectedEmployee) {
            const existing = checkExistingEvaluation(
                selectedEmployee,
                newData.month,
                newData.year
            );
            setExistingEvaluationData(existing);

            // Show warning if evaluation exists for new month/year
            if (existing) {
                const employee = employees.find(emp => (emp.id || emp._id) === selectedEmployee);
                const employeeName = employee ?
                    (employee.name || employee.fullName || `${employee.firstName || ''} ${employee.lastName || ''}`.trim())
                    : 'Selected Employee';
                const monthName = months.find(m => m.value === newData.month)?.label || 'Unknown Month';

                toast.warning(
                    `Evaluation already exists for ${employeeName} for ${monthName} ${newData.year}`,
                    { autoClose: 3000 }
                );
            }
        }
    };

    const handleGradeChange = (category, grade) => {
        setEvaluationData(prev => ({
            ...prev,
            grades: {
                ...prev.grades,
                [category]: grade
            }
        }));
    };

    const calculateOverallGrade = () => {
        const grades = Object.values(evaluationData.grades).filter(grade => grade !== '');
        if (grades.length === 0) return { grade: '', gpa: 0 };

        const totalPoints = grades.reduce((sum, grade) => {
            const gradeData = gradeOptions.find(opt => opt.value === grade);
            return sum + (gradeData ? gradeData.points : 0);
        }, 0);

        const gpa = (totalPoints / grades.length).toFixed(2);

        if (gpa >= 3.5) return { grade: 'A', gpa };
        if (gpa >= 2.5) return { grade: 'B', gpa };
        if (gpa >= 1.5) return { grade: 'C', gpa };
        return { grade: 'D', gpa };
    };

    const getGradeStyle = (grade) => {
        const gradeData = gradeOptions.find(opt => opt.value === grade);
        return gradeData || { color: 'bg-gray-500', bgColor: 'bg-gray-50' };
    };

    const validateForm = () => {
        const errors = [];

        if (!selectedEmployee) {
            errors.push('Please select an employee');
        }

        if (!evaluationData.month) {
            errors.push('Please select a month');
        }

        if (!evaluationData.year) {
            errors.push('Please select a year');
        }

        // Check if at least one grade is provided from any of the 5 categories
        const providedGrades = Object.values(evaluationData.grades).filter(grade => grade !== '');
        if (providedGrades.length === 0) {
            errors.push('Please provide at least one performance grade');
        }

        return errors;
    };

    const handleSubmit = async () => {
        // Validate form
        const validationErrors = validateForm();
        if (validationErrors.length > 0) {
            validationErrors.forEach(error => toast.error(error));
            return;
        }

        // Get employee name properly
        const selectedEmp = employees.find(emp => (emp.id || emp._id) === selectedEmployee);
        const employeeName = selectedEmp ?
            (selectedEmp.name || selectedEmp.fullName || `${selectedEmp.firstName || ''} ${selectedEmp.lastName || ''}`.trim())
            : 'Unknown Employee';

        // Check for existing evaluation with detailed logging
        const existingEval = checkExistingEvaluation(
            selectedEmployee,
            evaluationData.month,
            evaluationData.year
        );

        if (existingEval) {
            const monthName = months.find(m => m.value === evaluationData.month)?.label || 'Unknown Month';

            toast.error(
                `Evaluation already exists for ${employeeName} for ${monthName} ${evaluationData.year}`,
                { autoClose: 5000 }
            );
            return;
        }

        setSubmitting(true);
        try {
            const overallResult = calculateOverallGrade();

            // Prepare evaluation data
            const evaluationPayload = {
                ...evaluationData,
                employeeId: selectedEmployee,
                employeeName: employeeName,
                overallGrade: overallResult.grade,
                overallGPA: parseFloat(overallResult.gpa),
                evaluationDate: new Date().toISOString(),
                evaluatorRole: 'hr',
                createdAt: new Date().toISOString()
            };

            const response = await fetch('http://localhost:5004/api/plexus/evaluations/create', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(evaluationPayload)
            });

            if (response) {
                const result = await response.json();
                toast.success(`Evaluation submitted successfully`);

                // Reset form with previous month as default
                const { month: resetMonth, year: resetYear } = getPreviousMonthAndYear();
                setSelectedEmployee('');
                setExistingEvaluationData(null);
                setEvaluationData({
                    employeeId: '',
                    employeeName: '',
                    month: resetMonth,
                    year: resetYear,
                    grades: { work: '', speed: '', leave: '', time: '', behaviour: '' },
                    notes: ''
                });

                // Refresh evaluations list
                setTimeout(async () => {
                    await fetchEvaluations();
                }, 2000);
            } else {
                const err = await response.json();
                toast.error(err.message || 'Failed to submit evaluation');
            }
        } catch (error) {
            console.error('Submission error:', error);
            toast.error('Error submitting evaluation: ' + error.message);
        } finally {
            setSubmitting(false);
        }
    };

    const GradeSelector = ({ category, currentGrade, onGradeChange, disabled }) => (
        <div className="space-y-3">
            <div className="flex items-center justify-between">
                <div className="flex items-center">
                    <FontAwesomeIcon icon={gradeLabels[category].icon} className={`${gradeLabels[category].color} w-5 h-5 mr-2`} />
                    <h3 className="text-md font-semibold text-gray-800">{gradeLabels[category].label} <span className="text-gray-400 font-normal">({gradeLabels[category].name})</span></h3>
                </div>
                {currentGrade && (
                    <span className={`px-3 py-1 rounded-full text-sm font-bold text-white ${getGradeStyle(currentGrade).color}`}>
                        {currentGrade}
                    </span>
                )}
            </div>
            <div className="grid grid-cols-2 gap-2">
                {gradeOptions.map(option => (
                    <button
                        key={option.value}
                        type="button"
                        disabled={disabled}
                        onClick={(e) => {
                            // Prevent all default behaviors and scrolling
                            e.preventDefault();
                            e.stopPropagation();

                            // Store current scroll position
                            const currentScrollY = window.scrollY;

                            // Update the grade
                            onGradeChange(category, option.value);

                            // Restore scroll position immediately after state update
                            requestAnimationFrame(() => {
                                window.scrollTo(0, currentScrollY);
                            });

                            // Additional fallback to maintain scroll position
                            setTimeout(() => {
                                window.scrollTo(0, currentScrollY);
                            }, 0);
                        }}
                        className={`p-3 rounded-xl border-2 transition-all duration-200 text-sm font-medium focus:outline-none ${currentGrade === option.value
                            ? `${option.color} text-white border-transparent`
                            : `${option.bgColor} text-gray-700 border-gray-200 hover:border-gray-300`
                            } ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105'}`}
                        style={{ WebkitTapHighlightColor: 'transparent' }}
                    >
                        {option.label}
                    </button>
                ))}
            </div>
        </div>
    );

    // Show loading state while evaluations are being fetched
    if (evaluationsLoading) return (
        <div
            style={{
                height: '80vh',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                overflow: "hidden"
            }}
        >
            <div className="border p-4 flex items-center space-x-2 rounded-md">
                <div className="w-10 h-10 border-2 border-gray-300 rounded-full animate-spin dark:border-gray-800" style={{ borderTop: "2px solid #0777AB" }}></div>
            </div>
        </div>
    );

    return (
        // bg-gradient-to-br from-indigo-50 via-white to-cyan-0
        <div className="min-h-screen p-4 sm:p-6 rounded-2xl" style={{ scrollBehavior: 'auto' }}>
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className=" mb-8">
                    <h1 className="text-3xl font-[500] text-gray-800 mb-2">Employee Monthly Evaluation</h1>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Main Form */}
                    <div className="lg:col-span-2">
                        <div className="space-y-6">
                            {/* Basic Information */}
                            <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100">
                                <div className="flex items-center mb-6">
                                    <FontAwesomeIcon icon={faUser} className="text-[#0777AB] w-6 h-6 mr-3" />
                                    <h2 className="text-xl font-bold text-gray-800">Basic Information</h2>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                                            Select Employee <span className="text-red-500">*</span>
                                        </label>
                                        <select
                                            value={selectedEmployee}
                                            onChange={(e) => handleEmployeeSelect(e.target.value)}
                                            className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all"
                                            required
                                        >
                                            <option value="">{loading ? 'Loading employees...' : 'Choose an employee'}</option>
                                            {employees.map(emp => (
                                                <option key={emp.id || emp._id} value={emp.id || emp._id}>
                                                    {emp.name || emp.fullName || `${emp.firstName || ''} ${emp.lastName || ''}`.trim()}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                                            Month <span className="text-red-500">*</span>
                                        </label>
                                        <select
                                            value={evaluationData.month}
                                            onChange={(e) => handleMonthYearChange('month', e.target.value)}
                                            className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all"
                                            required
                                        >
                                            {months.map(month => (
                                                <option key={month.value} value={month.value}>{month.label}</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                                            Year <span className="text-red-500">*</span>
                                        </label>
                                        <select
                                            value={evaluationData.year}
                                            onChange={(e) => handleMonthYearChange('year', e.target.value)}
                                            className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all"
                                            required
                                        >
                                            {years.map(year => (
                                                <option key={year} value={year}>{year}</option>
                                            ))}
                                        </select>
                                    </div>


                                </div>

                                <div className="md:col-span-2 pt-3">
                                    <label className="block text-sm font-semibold text-gray-700 my-2">
                                        Notes (Optional)
                                    </label>
                                    <textarea
                                        value={evaluationData.notes}
                                        onChange={handleNotesChange}
                                        placeholder="Add any additional comments or observations..."
                                        rows="3"
                                        className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all resize-none"
                                        disabled={!!existingEvaluationData}
                                    />
                                </div>

                                {/* Existing Evaluation Warning */}
                                {existingEvaluationData && (
                                    <div className="mt-6 p-4 bg-amber-50 border-l-4 border-amber-400 rounded-r-xl">
                                        <div className="flex items-center">
                                            <FontAwesomeIcon icon={faExclamationTriangle} className="text-amber-600 w-5 h-5 mr-2" />
                                            <p className="text-amber-800 font-semibold">
                                                Evaluation already exists for this employee for {months.find(m => m.value === evaluationData.month)?.label} {evaluationData.year}
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Performance Evaluation */}
                            <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100">
                                <div className="flex items-center mb-6">
                                    <FontAwesomeIcon icon={faChartLine} className="text-purple-600 w-6 h-6 mr-3" />
                                    <h2 className="text-xl font-bold text-gray-800">Performance Evaluation</h2>
                                    <span className="text-red-500 ml-2 text-sm">(At least one grade required)</span>
                                </div>

                                <div className="space-y-6">
                                    {Object.entries(gradeLabels).map(([key]) => (
                                        <GradeSelector
                                            key={key}
                                            category={key}
                                            currentGrade={evaluationData.grades[key]}
                                            onGradeChange={handleGradeChange}
                                            disabled={!!existingEvaluationData}
                                        />
                                    ))}
                                </div>
                            </div>

                            {/* Submit Button */}
                            <div className="flex justify-center">
                                <button
                                    type="button"
                                    onClick={handleSubmit}
                                    disabled={submitting || !!existingEvaluationData}
                                    className="px-7 py-3 bg-[#0777AB] text-white text-lg rounded-xl shadow-lg hover:scale-105 disabled:opacity-50 disabled:hover:scale-100 transition-all duration-200 focus:outline-none"
                                >
                                    {submitting ? 'Submitting Evaluation...' : 'Submit Monthly Evaluation'}
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Sidebar - Grading Scale */}
                    <div className="space-y-6">
                        <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100">
                            <h3 className="text-lg font-bold text-gray-800 mb-4">Grading Scale</h3>
                            <div className="space-y-3">
                                {gradeOptions.map(option => (
                                    <div key={option.value} className="flex items-center justify-between p-3 rounded-xl bg-gray-50">
                                        <div className="flex items-center">
                                            <span className={`w-8 h-8 rounded-full ${option.color} text-white font-bold flex items-center justify-center text-sm mr-3`}>
                                                {option.value}
                                            </span>
                                            <span className="font-medium text-gray-700">
                                                {option.value === 'A' ? 'Excellent' :
                                                    option.value === 'B' ? 'Good' :
                                                        option.value === 'C' ? 'Average' : 'Below Average'}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Current Overall Grade Preview */}
                        {selectedEmployee && Object.values(evaluationData.grades).some(grade => grade !== '') && (
                            <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100">
                                <h3 className="text-lg font-bold text-gray-800 mb-4">Overall Grade Preview</h3>
                                <div className="text-center">
                                    {(() => {
                                        const overall = calculateOverallGrade();
                                        return overall.grade ? (
                                            <div>
                                                <div className={`w-16 h-16 rounded-full ${getGradeStyle(overall.grade).color} text-white font-bold flex items-center justify-center text-2xl mx-auto mb-2`}>
                                                    {overall.grade}
                                                </div>
                                                {/* <p className="text-gray-600">GPA: {overall.gpa}</p> */}
                                            </div>
                                        ) : null;
                                    })()}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <ToastContainer position="top-center" className="!z-[99999]" />
        </div>
    );
};

export default Evaluations;