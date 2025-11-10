import React, { useEffect, useState, useRef } from "react";
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';
import { Bar } from 'react-chartjs-2';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCalendar, faUser, faEdit, faTrash, faTimes, faSave, faExclamationTriangle, faBriefcase, faClock, faUserCheck } from "@fortawesome/free-solid-svg-icons";
import { toast } from "react-toastify";
import html2canvas from 'html2canvas';
import ReactDOM from 'react-dom/client';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const Monthly = () => {
    const [evaluations, setEvaluations] = useState([]);
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
    const [availableYears, setAvailableYears] = useState([]);
    const [chartData, setChartData] = useState({});
    const [loading, setLoading] = useState(true);
    const [isDarkMode, setIsDarkMode] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [selectedEvaluation, setSelectedEvaluation] = useState(null);
    const [editFormData, setEditFormData] = useState({
        work: '',
        speed: '',
        time: '',
        behaviour: '',
        leave: '',
        notes: ''
    });

    // Add ref to store scroll position
    const scrollPositionRef = useRef(0);

    // Grade options configuration
    const gradeOptions = [
        { value: 'A', label: 'A - Excellent (75-100%)', points: 4.0, color: 'bg-green-500', bgColor: 'bg-green-50' },
        { value: 'B', label: 'B - Good (74-50%)', points: 3.0, color: 'bg-blue-500', bgColor: 'bg-blue-50' },
        { value: 'C', label: 'C - Average (49-25%)', points: 2.0, color: 'bg-yellow-500', bgColor: 'bg-yellow-50' },
        { value: 'D', label: 'D - Below Average (Below 24%)', points: 1.0, color: 'bg-red-500', bgColor: 'bg-red-50' }
    ];

     const gradeLabels = {
            work: { icon: faBriefcase, label: 'Work Performance', name : 'Vrushabh sir', color: 'text-blue-600' },
            speed: { icon: faBriefcase, label: 'Work Speed & Efficiency',name : 'Vrushabh sir', color: 'text-indigo-600' },
            leave: { icon: faCalendar, label: 'Leave Management', name : 'HR',color: 'text-green-600' },
            time: { icon: faClock, label: 'Time Management', name : 'HR',color: 'text-purple-600' },
            behaviour: { icon: faUserCheck, label: 'Behaviour & Attitude', name : 'HR',color: 'text-orange-600' }
        };

    const getGradeStyle = (grade) => {
        const gradeData = gradeOptions.find(opt => opt.value === grade);
        return gradeData || { color: 'bg-gray-500', bgColor: 'bg-gray-50' };
    };

    // Updated GradeSelector Component with better scroll handling
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
                        onMouseDown={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            onGradeChange(category, option.value);
                        }}
                        className={`p-3 rounded-xl border-2 transition-all duration-200 text-sm font-medium focus:outline-none
        ${currentGrade === option.value
                                ? `${option.color} text-white border-transparent`
                                : `${option.bgColor} text-gray-700 border-gray-200 hover:border-gray-300`}
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105'}`}
                        style={{ WebkitTapHighlightColor: 'transparent' }}
                    >
                        {option.label}
                    </button>

                ))}
            </div>
        </div>
    );

    useEffect(() => {
        const checkDarkMode = () => {
            setIsDarkMode(document.documentElement.classList.contains('dark'));
        };
        checkDarkMode();

        const observer = new MutationObserver(checkDarkMode);
        observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });

        fetchData();

        return () => observer.disconnect();
    }, []);

    useEffect(() => {
        if (evaluations.length >= 0) {
            processChartData();
        }
    }, [evaluations, selectedYear, isDarkMode]);

    // Add useEffect to restore scroll position after grade selection
    useEffect(() => {
        // Restore scroll position after state updates
        if (scrollPositionRef.current > 0) {
            // Use multiple methods to ensure scroll position is maintained
            const restoreScroll = () => {
                window.scrollTo(0, scrollPositionRef.current);
                document.documentElement.scrollTop = scrollPositionRef.current;
                document.body.scrollTop = scrollPositionRef.current;
            };

            // Try immediately
            restoreScroll();

            // Try after a short delay
            setTimeout(restoreScroll, 0);

            // Try after DOM updates
            requestAnimationFrame(restoreScroll);

            // Reset the stored position
            scrollPositionRef.current = 0;
        }
    }, [editFormData]);

    const fetchData = async () => {
        try {
            setLoading(true);
            const response = await fetch("http://localhost:5004/api/plexus/evaluations/read");
            const data = await response.json();
            if (data && data.status === 'Success!') {
                setEvaluations(data.data);
                const years = [...new Set(data.data.map(item => parseInt(item.year)))].sort((a, b) => b - a);
                setAvailableYears(years);
            } else {
                toast.error("Failed to fetch data");
            }
        } catch (error) {
            console.error("Error fetching data:", error);
            toast.error("An error occurred while fetching data");
        } finally {
            setLoading(false);
        }
    };

    const gradeToNumber = (grade) => {
        switch (grade) {
            case 'A': return 4;
            case 'B': return 3;
            case 'C': return 2;
            case 'D': return 1;
            default: return 0;
        }
    };

    const isEvaluationComplete = (evaluation) => {
        const requiredFields = ['work', 'speed', 'time', 'behaviour', 'leave'];
        return requiredFields.every(field => evaluation[field] && evaluation[field] !== '');
    };

    const processChartData = () => {
        const filteredData = evaluations.filter(item => parseInt(item.year) === selectedYear);
        const employeeData = {};

        filteredData.forEach(item => {
            const { employeeName, month, overallGrade, evaluatorRole } = item;
            if (!employeeData[employeeName]) employeeData[employeeName] = {};
            if (!employeeData[employeeName][month]) employeeData[employeeName][month] = {};

            // Store the complete evaluation data for later use
            employeeData[employeeName][month][evaluatorRole] = gradeToNumber(overallGrade);
            employeeData[employeeName][month].evaluationData = item;
            employeeData[employeeName][month].isComplete = isEvaluationComplete(item);
        });

        const processedData = {};
        Object.keys(employeeData).forEach(employeeName => {
            const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
            const hrData = [];
            const backgroundColors = [];
            const borderColors = [];

            for (let month = 1; month <= 12; month++) {
                const monthStr = month.toString();
                const monthData = employeeData[employeeName][monthStr];
                const gradeValue = monthData?.hr || 0;
                const isComplete = monthData?.isComplete || false;

                hrData.push(gradeValue);

                if (gradeValue > 0) {
                    if (isComplete) {
                        // Complete evaluation - full color
                        backgroundColors.push(isDarkMode ? 'rgba(191, 131, 255, 0.8)' : 'rgba(191, 131, 255, 0.7)');
                        borderColors.push(isDarkMode ? 'rgba(191, 131, 255, 1)' : 'rgba(139, 69, 255, 1)');
                    } else {
                        // Incomplete evaluation - warning color (orange/yellow)
                        backgroundColors.push(isDarkMode ? 'rgba(107, 114, 128, 0.3)' : 'rgba(229, 231, 235, 0.5)');
                        borderColors.push(isDarkMode ? 'rgba(107, 114, 128, 0.5)' : 'rgba(209, 213, 219, 1)');
                    }
                } else {
                    // No evaluation - default color
                    backgroundColors.push(isDarkMode ? 'rgba(107, 114, 128, 0.3)' : 'rgba(229, 231, 235, 0.5)');
                    borderColors.push(isDarkMode ? 'rgba(107, 114, 128, 0.5)' : 'rgba(209, 213, 219, 1)');
                }
            }

            processedData[employeeName] = {
                labels: months,
                datasets: [
                    {
                        label: 'Evaluation',
                        data: hrData,
                        backgroundColor: backgroundColors,
                        borderColor: borderColors,
                        borderWidth: 2,
                        borderRadius: 8,
                        borderSkipped: false,
                        hoverBackgroundColor: backgroundColors.map(color => color.replace('0.7', '0.95').replace('0.8', '0.95')),
                        hoverBorderColor: borderColors,
                        hoverBorderWidth: 3
                    }
                ]
            };
        });

        setChartData(processedData);
    };

    const handleBarClick = (event, elements, employeeName) => {
        if (elements.length > 0) {
            const clickedIndex = elements[0].index;
            const month = (clickedIndex + 1).toString();

            const evaluation = evaluations.find(item =>
                item.employeeName === employeeName &&
                item.month === month &&
                parseInt(item.year) === selectedYear
            );

            if (evaluation) {
                setSelectedEvaluation(evaluation);
                setEditFormData({
                    work: evaluation.work || '',
                    speed: evaluation.speed || '',
                    time: evaluation.time || '',
                    behaviour: evaluation.behaviour || '',
                    leave: evaluation.leave || '',
                    notes: evaluation.notes || '' // Add this line
                });
                setShowEditModal(true);
            } else {
                toast.info(`No evaluation found for ${employeeName} in month ${month}`);
            }
        }
    };

    const handleDeleteEvaluation = async () => {
        if (!selectedEvaluation) return;

        if (window.confirm(`Are you sure you want to delete the evaluation for ${selectedEvaluation.employeeName}?`)) {
            try {
                const response = await fetch(`http://localhost:5004/api/plexus/evaluations/delete/${selectedEvaluation._id}`, {
                    method: 'DELETE',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                });

                const data = await response.json();

                if (data.status === 'Success!') {
                    // Update local state immediately by removing the deleted evaluation
                    setEvaluations(prevEvaluations =>
                        prevEvaluations.filter(e => e._id !== selectedEvaluation._id)
                    );

                    setShowEditModal(false);
                    setSelectedEvaluation(null);
                    toast.success('Evaluation deleted successfully!');
                } else {
                    throw new Error(data.message || 'Failed to delete evaluation');
                }
            } catch (error) {
                console.error('Error deleting evaluation:', error);
                toast.error(`Error deleting evaluation: ${error.message}`);
            }
        }
    };

    const calculateOverallGrade = (grades) => {
        console.log(grades);

        const validGrades = Object.values(grades).filter(grade => grade !== '');
        if (validGrades.length === 0) return 'D';

        const totalPoints = validGrades.reduce((sum, grade) => {
            return sum + gradeToNumber(grade);
        }, 0);

        const gpa = totalPoints / validGrades.length;

        if (gpa >= 3.5) return 'A';
        else if (gpa >= 2.5) return 'B';
        else if (gpa >= 1.5) return 'C';
        else return 'D';
    };

    const handleUpdateEvaluation = async () => {
        if (!selectedEvaluation) return;

        try {
            const overallGrade = calculateOverallGrade({
                work: editFormData.work,
                speed: editFormData.speed,
                time: editFormData.time,
                behaviour: editFormData.behaviour,
                leave: editFormData.leave
            });

            // console.log(overallGrade);

            const updatePayload = {
                grades: {
                    work: editFormData.work,
                    speed: editFormData.speed,
                    time: editFormData.time,
                    behaviour: editFormData.behaviour,
                    leave: editFormData.leave
                },
                notes: editFormData.notes, // Add this line
                overallGrade,
                employeeName: selectedEvaluation.employeeName,
                employeeId: selectedEvaluation.employeeId,
                month: selectedEvaluation.month,
                year: selectedEvaluation.year,
                evaluatorRole: selectedEvaluation.evaluatorRole
            };

            const response = await fetch(`http://localhost:5004/api/plexus/evaluations/update/${selectedEvaluation._id}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(updatePayload),
            });

            const data = await response.json();

            if (data.status === 'Success!') {
                // Update local state with the returned data
                fetchData();

                setShowEditModal(false);
                setSelectedEvaluation(null);
                toast.success('Evaluation updated successfully!');
            } else {
                throw new Error(data.message || 'Failed to update evaluation');
            }

        } catch (error) {
            console.error('Error updating evaluation:', error);
            toast.error(`Error updating evaluation: ${error.message}`);
        }
    };

    const getEmployeeGradeSummary = (employeeName) => {
        const filteredData = evaluations.filter(item =>
            parseInt(item.year) === selectedYear &&
            item.employeeName === employeeName &&
            item.evaluatorRole === 'hr'
        );

        const gradeCounts = { A: 0, B: 0, C: 0, D: 0 };

        filteredData.forEach(item => {
            if (item.overallGrade && ['A', 'B', 'C', 'D'].includes(item.overallGrade)) {
                gradeCounts[item.overallGrade]++;
            }
        });

        return gradeCounts;
    };

    const getChartOptions = (employeeName) => ({
        responsive: true,
        maintainAspectRatio: false,
        onClick: (event, elements) => handleBarClick(event, elements, employeeName),
        plugins: {
            legend: {
                position: 'top',
                align: 'start',
                labels: {
                    font: {
                        size: 14,
                        family: 'Outfit, sans-serif',
                        weight: '500'
                    },
                    padding: 25,
                    usePointStyle: true,
                    pointStyle: 'circle',
                    color: isDarkMode ? '#e5e7eb' : '#374151',
                    boxWidth: 12,
                    boxHeight: 12
                }
            },
            tooltip: {
                backgroundColor: isDarkMode ? 'rgba(31, 38, 53, 0.95)' : 'rgba(255, 255, 255, 0.95)',
                titleColor: isDarkMode ? '#f9fafb' : '#111827',
                bodyColor: isDarkMode ? '#d1d5db' : '#374151',
                borderColor: isDarkMode ? '#4b5563' : '#e5e7eb',
                borderWidth: 1,
                cornerRadius: 12,
                displayColors: true,
                titleFont: {
                    size: 14,
                    weight: 'bold',
                    family: 'Outfit, sans-serif'
                },
                bodyFont: {
                    size: 13,
                    family: 'Outfit, sans-serif'
                },
                padding: 12,
                callbacks: {
                    title: function (context) {
                        return `${context[0].label} - ${employeeName}`;
                    },
                    label: function (context) {
                        const gradeMap = { 1: 'D', 2: 'C', 3: 'B', 4: 'A', 0: 'No Grade' };
                        const month = context.dataIndex + 1;
                        const evaluation = evaluations.find(item =>
                            item.employeeName === employeeName &&
                            item.month === month.toString() &&
                            parseInt(item.year) === selectedYear
                        );

                        const isComplete = evaluation ? isEvaluationComplete(evaluation) : false;
                        const status = isComplete ? '✓ Complete' : '⚠ Incomplete';

                        return [
                            `${context.dataset.label}: Grade ${gradeMap[context.parsed.y]}`,
                            `Status: ${status}`,
                            'Click to edit'
                        ];
                    }
                }
            }
        },
        scales: {
            x: {
                grid: {
                    display: false
                },
                ticks: {
                    font: {
                        size: 12,
                        family: 'Outfit, sans-serif',
                        weight: '500'
                    },
                    color: isDarkMode ? '#9ca3af' : '#6b7280'
                },
                title: {
                    display: true,
                    text: 'Months (Click bars to edit & delete)',
                    font: {
                        size: 14,
                        weight: 'bold',
                        family: 'Outfit, sans-serif'
                    },
                    color: isDarkMode ? '#d1d5db' : '#374151',
                    padding: { top: 10 }
                }
            },
            y: {
                beginAtZero: true,
                max: 4,
                grid: {
                    color: isDarkMode ? 'rgba(75, 85, 99, 0.3)' : 'rgba(243, 244, 246, 0.8)',
                    lineWidth: 1
                },
                ticks: {
                    font: {
                        size: 12,
                        family: 'Outfit, sans-serif',
                        weight: '500'
                    },
                    color: isDarkMode ? '#9ca3af' : '#6b7280',
                    stepSize: 1,
                    callback: function (value) {
                        const gradeMap = { 1: 'D', 2: 'C', 3: 'B', 4: 'A' };
                        return gradeMap[value] || '';
                    }
                },
                title: {
                    display: true,
                    text: 'Performance Grade',
                    font: {
                        size: 14,
                        weight: 'bold',
                        family: 'Outfit, sans-serif'
                    },
                    color: isDarkMode ? '#d1d5db' : '#374151',
                    padding: { bottom: 10 }
                }
            }
        },
        interaction: {
            intersect: false,
            mode: 'index'
        },
        animation: {
            duration: 1000,
            easing: 'easeOutCubic',
            delay: (context) => context.dataIndex * 50
        },
        elements: {
            bar: {
                borderRadius: 8,
                borderSkipped: false
            }
        },
        hover: {
            animationDuration: 200
        }
    });

    const generateReport = async (employeeName, month) => {
        const monthName = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][parseInt(month) - 1];

        toast.info(`Generating report for ${employeeName} - ${monthName} ${selectedYear}...`);

        // Create a temporary container
        const container = document.createElement('div');
        container.style.position = 'absolute';
        container.style.left = '-9999px';
        container.style.top = '0';
        document.body.appendChild(container);

        // Render the report
        const root = ReactDOM.createRoot(container);
        root.render(
            <ReportPreview
                employeeName={employeeName}
                month={month}
                year={selectedYear}
                evaluations={evaluations}
                gradeLabels={gradeLabels}
                gradeOptions={gradeOptions}
            />
        );

        // Wait for rendering
        await new Promise(resolve => setTimeout(resolve, 500));

        try {
            const reportElement = container.querySelector('#report-preview');
            const canvas = await html2canvas(reportElement, {
                scale: 2,
                backgroundColor: '#ffffff',
                logging: false,
                width: 1200,
                windowWidth: 1200,
                useCORS: true,
            });

            // Convert to blob and download
            canvas.toBlob((blob) => {
                const url = URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.download = `${employeeName}_Evaluation_${monthName}_${selectedYear}.png`;
                link.href = url;
                link.click();
                URL.revokeObjectURL(url);

                toast.success(`Report for ${monthName} ${selectedYear} downloaded successfully!`);
            });
        } catch (error) {
            console.error('Error generating report:', error);
            toast.error('Failed to generate report');
        } finally {
            // Cleanup
            root.unmount();
            document.body.removeChild(container);
        }
    };



    if (loading) return (
        <div className="h-80 flex justify-center items-center">
            <div className="border p-4 flex items-center space-x-2 rounded-md">
                <div className="w-10 h-10 border-2 border-gray-300 rounded-full animate-spin" style={{ borderTop: "2px solid #0777AB" }}></div>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen p-6" style={{ scrollBehavior: 'auto' }}>
            <div className="max-w-7xl mx-auto">


                {/* Year Selector */}
                {Object.keys(chartData).length !== 0 && (
                    <div className="mb-8 flex items-center space-x-4 justify-end">
                        <FontAwesomeIcon icon={faCalendar} className="text-gray-700 dark:text-gray-300" />
                        <label htmlFor="year-select" className="text-lg font-semibold text-gray-700 dark:text-gray-300">
                            Select Year:
                        </label>
                        <select
                            id="year-select"
                            value={selectedYear}
                            onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                            className="px-4 py-2 border min-w-32 text-gray-800 dark:text-gray-200 border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 bg-white dark:bg-gray-800 shadow-sm"
                        >
                            {availableYears.map((year) => (
                                <option key={year} value={year}>
                                    {year}
                                </option>
                            ))}
                        </select>
                    </div>
                )}

                {/* Legend */}
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4 mb-6">
                    {/* Existing Evaluation Notes */}
                    <div className="flex flex-wrap items-center justify-center gap-6 text-sm mb-6">
                        <div className="flex items-center">
                            <div className="w-4 h-4 rounded bg-purple-500 mr-2"></div>
                            <span className="text-gray-700 dark:text-gray-300">Complete Evaluation</span>
                        </div>
                        <div className="flex items-center">
                            <div className="w-4 h-4 rounded bg-gray-300 mr-2"></div>
                            <span className="text-gray-700 dark:text-gray-300">Incomplete Evaluation</span>
                        </div>
                    </div>

                    {/* Grade Notes */}
                    <div className="flex flex-wrap items-center justify-center gap-6 text-sm">
                        {gradeOptions.map((grade) => (
                            <div key={grade.value} className="flex items-center">
                                <div className={`w-4 h-4 rounded ${grade.color} mr-2`}></div>
                                <span className="text-gray-700 dark:text-gray-300">{grade.label}</span>
                            </div>
                        ))}
                    </div>
                </div>


                {/* Charts */}
                <div className="space-y-8">
                    {Object.keys(chartData).map(employeeName => {
                        const gradeSummary = getEmployeeGradeSummary(employeeName);
                        const employeeEvaluations = evaluations.filter(item =>
                            item.employeeName === employeeName &&
                            parseInt(item.year) === selectedYear
                        );
                        const incompleteCount = employeeEvaluations.filter(item => !isEvaluationComplete(item)).length;

                        return (
                            <div key={employeeName} className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 border">
                                <div className="mb-6">
                                    <h2 className="text-2xl font-bold text-blue-600 dark:text-purple-400 mb-2 capitalize">
                                        {employeeName}
                                    </h2>
                                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                                        <div className="flex items-center gap-4">
                                            <p className="text-gray-600 dark:text-gray-400 font-medium">
                                                Performance Overview - {selectedYear}
                                            </p>
                                            {incompleteCount > 0 && (
                                                <div className="flex items-center text-orange-600 dark:text-orange-400">
                                                    <FontAwesomeIcon icon={faExclamationTriangle} className="mr-1 text-sm" />
                                                    <span className="text-sm font-medium">{incompleteCount} Incomplete</span>
                                                </div>
                                            )}
                                        </div>
                                        {/* Grade Summary */}
                                        <div className="flex items-center space-x-4 text-sm">
                                            <span className="text-gray-600 dark:text-gray-400 font-medium">Grade Summary:</span>
                                            <div className="flex space-x-3">
                                                <span className="px-2 py-1 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 rounded-md font-semibold">
                                                    A: {gradeSummary.A}
                                                </span>
                                                <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-md font-semibold">
                                                    B: {gradeSummary.B}
                                                </span>
                                                <span className="px-2 py-1 bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 rounded-md font-semibold">
                                                    C: {gradeSummary.C}
                                                </span>
                                                <span className="px-2 py-1 bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 rounded-md font-semibold">
                                                    D: {gradeSummary.D}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="h-96 cursor-pointer">
                                    <Bar
                                        data={chartData[employeeName]}
                                        options={getChartOptions(employeeName)}
                                    />
                                </div>

                                {/* Monthly Report Section */}
                                <div className="mt-6">
                                    {/* Section Title */}
                                    <h3 className="text-lg font-semibold mb-2">
                                        Monthly Evaluation Reports
                                    </h3>
                                    {/* Hint / Description */}
                                    <p className="text-sm text-gray-500 mb-4">
                                        Click on a month to generate the evaluation report. Disabled months indicate no data is available.
                                    </p>

                                    {/* Monthly Report Buttons */}
                                    <div className="grid grid-cols-6 sm:grid-cols-12 gap-2">
                                        {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].map((monthName, index) => {
                                            const monthNum = index + 1;
                                            const hasData = evaluations.some(
                                                item => item.employeeName === employeeName &&
                                                    parseInt(item.month) === monthNum &&
                                                    parseInt(item.year) === selectedYear
                                            );

                                            return (
                                                <button
                                                    key={monthNum}
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        if (hasData) {
                                                            generateReport(employeeName, monthNum.toString());
                                                        } else {
                                                            toast.warning(`No evaluation data for ${monthName}`);
                                                        }
                                                    }}
                                                    disabled={!hasData}
                                                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-all
                        ${hasData
                                                            ? 'bg-[#0777ab] text-white hover:bg-[#055a80] cursor-pointer shadow-md hover:shadow-lg'
                                                            : 'bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed'}`}
                                                    title={hasData ? `Generate report for ${monthName}` : `No data for ${monthName}`}
                                                >
                                                    {monthName}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>

                            </div>
                        );
                    })}

                    {Object.keys(chartData).length === 0 && (
                        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-12 text-center">
                            <FontAwesomeIcon icon={faUser} className="text-4xl text-gray-400 mb-4" />
                            <h3 className="text-xl font-semibold text-gray-600 dark:text-gray-300 mb-2">
                                No Data Available
                            </h3>
                            <p className="text-gray-500 dark:text-gray-400">
                                No evaluations found for the selected year
                            </p>
                        </div>
                    )}
                </div>
            </div>

            {/* Edit Modal */}
            {showEditModal && selectedEvaluation && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-99999 p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                        <div className="p-6">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-2xl font-bold text-gray-800 dark:text-white">
                                    Edit Evaluation - {selectedEvaluation.employeeName}
                                </h3>
                                <button
                                    onClick={() => setShowEditModal(false)}
                                    className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                                >
                                    <FontAwesomeIcon icon={faTimes} className="text-xl" />
                                </button>
                            </div>

                            <div className="mb-4 p-4 bg-gray-100 dark:bg-gray-700 rounded-lg">
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                    <strong>Month:</strong> {selectedEvaluation.month}/{selectedEvaluation.year}
                                </p>
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                    <strong>Current Overall Grade:</strong> {selectedEvaluation.overallGrade}
                                </p>
                            </div>

                            <div className="space-y-6">
                                {Object.entries(editFormData).map(([field, value]) => {
                                    if (field === 'notes') return null; // Skip notes in the loop
                                    return (
                                        <GradeSelector
                                            key={field}
                                            category={field}
                                            currentGrade={value}
                                            onGradeChange={(category, grade) => setEditFormData(prev => ({
                                                ...prev,
                                                [category]: grade
                                            }))}
                                            disabled={false}
                                        />
                                    );
                                })}

                                {/* Add Notes Section */}
                                <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-600">
                                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                        Notes (Optional)
                                    </label>
                                    <textarea
                                        value={editFormData.notes}
                                        onChange={(e) => setEditFormData(prev => ({
                                            ...prev,
                                            notes: e.target.value
                                        }))}
                                        placeholder="Add any additional comments or observations..."
                                        rows="4"
                                        className="w-full border-2 border-gray-200 dark:border-gray-600 rounded-xl px-4 py-3 
                     focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 
                     dark:bg-gray-700 dark:text-white transition-all resize-none"
                                    />
                                </div>
                            </div>

                            <div className="flex justify-between mt-8">
                                <button
                                    onClick={handleDeleteEvaluation}
                                    className="px-4 py-2 bg-red-700 text-white rounded-lg hover:bg-red-700 flex items-center"
                                >
                                    <FontAwesomeIcon icon={faTrash} className="mr-2" />
                                    Delete
                                </button>

                                <div className="flex space-x-3">
                                    <button
                                        onClick={() => setShowEditModal(false)}
                                        className="px-4 py-2 bg-gray-400 text-white rounded-lg hover:bg-gray-600"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleUpdateEvaluation}
                                        className="px-4 py-2 bg-[#0777ab] text-white rounded-lg flex items-center"
                                    >
                                        <FontAwesomeIcon icon={faSave} className="mr-2" />
                                        Save Changes
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

const ReportPreview = ({ employeeName, month, year, evaluations, gradeLabels, gradeOptions }) => {
    const getMonthName = (monthNum) => {
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        return months[monthNum - 1];
    };

    const getGradeStyle = (grade) => {
        const gradeData = gradeOptions.find(opt => opt.value === grade);
        return gradeData || { color: 'bg-gray-500', bgColor: 'bg-gray-50' };
    };

    const gradeToNumber = (grade) => {
        switch (grade) {
            case 'A': return 4;
            case 'B': return 3;
            case 'C': return 2;
            case 'D': return 1;
            default: return 0;
        }
    };

    const currentEvaluation = evaluations.find(e =>
        e.employeeName === employeeName &&
        e.month === month.toString() &&
        parseInt(e.year) === year
    );

    const getPreviousMonths = () => {
        const currentMonth = parseInt(month);
        const months = [];

        for (let i = 1; i <= 2; i++) {
            let targetMonth = currentMonth - i;
            let targetYear = parseInt(year);

            if (targetMonth <= 0) {
                targetMonth += 12;
                targetYear -= 1;
            }

            const evaluation = evaluations.find(e =>
                e.employeeName === employeeName &&
                e.month === targetMonth.toString() &&
                parseInt(e.year) === targetYear
            );

            months.push({
                month: targetMonth,
                year: targetYear,
                evaluation: evaluation || null
            });
        }

        return months.reverse();
    };

    const previousMonths = getPreviousMonths();

    // Prepare chart data for react-chartjs-2
    const categories = Object.keys(gradeLabels);

    const chartData = {
        labels: categories.map(cat => gradeLabels[cat].label),
        datasets: [
            {
                label: previousMonths[0] ? `${getMonthName(previousMonths[0].month)} ${previousMonths[0].year}` : 'N/A',
                data: categories.map(cat => gradeToNumber(previousMonths[0]?.evaluation?.[cat])),
                backgroundColor: '#7DB9DE',
                borderColor: '#7DB9DE',
                borderWidth: 0,
                borderRadius: 4,
            },
            {
                label: previousMonths[1] ? `${getMonthName(previousMonths[1].month)} ${previousMonths[1].year}` : 'N/A',
                data: categories.map(cat => gradeToNumber(previousMonths[1]?.evaluation?.[cat])),
                backgroundColor: '#1E6BA6',
                borderColor: '#1E6BA6',
                borderWidth: 0,
                borderRadius: 4,
            },
            {
                label: `${getMonthName(parseInt(month))} ${year} (Current)`,
                data: categories.map(cat => gradeToNumber(currentEvaluation?.[cat])),
                backgroundColor: '#90C956',
                borderColor: '#90C956',
                borderWidth: 0,
                borderRadius: 4,
            }
        ]
    };

    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'top',
                align: 'center',
                labels: {
                    font: {
                        size: 13,
                        family: 'Outfit, sans-serif',
                        weight: '600'
                    },
                    padding: 15,
                    usePointStyle: true,
                    pointStyle: 'circle',
                    boxWidth: 10,
                    boxHeight: 10
                }
            },
            tooltip: {
                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                titleColor: '#111827',
                bodyColor: '#374151',
                borderColor: '#e5e7eb',
                borderWidth: 1,
                cornerRadius: 8,
                titleFont: {
                    size: 13,
                    weight: 'bold',
                    family: 'Outfit, sans-serif'
                },
                bodyFont: {
                    size: 12,
                    family: 'Outfit, sans-serif'
                },
                padding: 10,
                callbacks: {
                    label: function (context) {
                        const gradeMap = { 1: 'D', 2: 'C', 3: 'B', 4: 'A', 0: 'N/A' };
                        return `${context.dataset.label}: Grade ${gradeMap[context.parsed.y]}`;
                    }
                }
            }
        },
        scales: {
            y: {
                beginAtZero: false, // start from 1 instead of 0
                min: 1,
                max: 4,
                grid: {
                    color: 'rgba(243, 244, 246, 0.8)',
                    lineWidth: 1
                },
                ticks: {
                    font: {
                        size: 11,
                        family: 'Outfit, sans-serif',
                        weight: '500'
                    },
                    color: '#6b7280',
                    stepSize: 1,
                    callback: function (value) {
                        const gradeMap = { 1: 'D', 2: 'C', 3: 'B', 4: 'A' };
                        return gradeMap[value] || '';
                    }
                },
                title: {
                    display: false
                }
            },
            x: {
                grid: {
                    display: false
                },
                ticks: {
                    font: {
                        size: 14,
                        family: 'Outfit, sans-serif',
                        weight: '500'
                    },
                    color: '#374151'
                }
            }
        },
        barThickness: 35,
        maxBarThickness: 40
    };

    return (
        <div id="report-preview" style={{
            background: 'white',
            padding: '40px',
            width: '1200px',
            fontFamily: 'Outfit, sans-serif'
        }}>
            {/* Header */}
            <div style={{ textAlign: 'center', marginBottom: '40px', borderBottom: '3px solid #0777ab', paddingBottom: '20px' }}>
                <h1 style={{ fontSize: '32px', fontWeight: 'bold', color: '#0777ab', margin: '0 0 10px 0' }}>
                    Performance Evaluation Report
                </h1>
                <h2 style={{ fontSize: '24px', fontWeight: '600', color: '#374151', margin: '0' }}>
                    {employeeName}
                </h2>
                <p style={{ fontSize: '24px', color: '#1f2937', margin: '10px 0 5px 0', fontWeight: '600' }}>
                    {getMonthName(parseInt(month))} {year}
                </p>
                <p style={{ fontSize: '14px', color: '#6b7280', margin: '5px 0 0 0' }}>
                    Report Generated: {new Date().toLocaleDateString()}
                </p>
            </div>

            {/* Current Month Detailed Evaluation */}
            {currentEvaluation ? (
                <div style={{
                    marginBottom: '40px',
                    border: '3px solid #0777ab',
                    borderRadius: '12px',
                    padding: '24px',
                    backgroundColor: '#eff6ff'
                }}>
                    <div style={{ marginBottom: '20px', textAlign: 'center' }}>
                        <h3 style={{
                            fontSize: '24px',
                            fontWeight: 'bold',
                            color: '#0777ab',
                            margin: '0 0 12px 0'
                        }}>
                            Current Month Evaluation
                        </h3>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px' }}>
                            <span style={{ fontSize: '18px', color: '#374151', fontWeight: '600' }}>
                                Overall Grade:
                            </span>
                            <span style={{
                                color: 'black',
                                padding: '8px 24px',
                                borderRadius: '10px',
                                fontSize: '24px',
                                fontWeight: 'bold'
                            }}>
                                {currentEvaluation.overallGrade}
                            </span>
                        </div>
                    </div>

                    {/* Grade Details Grid */}
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(2, 1fr)',
                        gap: '16px',
                        marginBottom: '20px'
                    }}>
                        {Object.entries(gradeLabels).map(([key, { label }]) => (
                            <div key={key} style={{
                                background: '#ffffff',
                                padding: '16px',
                                borderRadius: '8px',
                                border: '2px solid #e5e7eb'
                            }}>
                                <div style={{
                                    fontSize: '18px',
                                    color: '#6b7280',
                                    marginBottom: '10px',
                                    fontWeight: '500'
                                }}>
                                    {label}
                                </div>
                                <div style={{
                                    fontSize: '28px',
                                    fontWeight: 'bold',
                                    color: currentEvaluation[key] ? '#1f2937' : '#9ca3af'
                                }}>
                                    {currentEvaluation[key] || 'N/A'}
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Notes */}
                    {currentEvaluation.notes && (
                        <div style={{
                            background: '#fef3c7',
                            border: '2px solid #fbbf24',
                            borderRadius: '8px',
                            padding: '16px'
                        }}>
                            <div style={{
                                fontSize: '16px',
                                fontWeight: 'bold',
                                color: '#92400e',
                                marginBottom: '8px'
                            }}>
                                Notes:
                            </div>
                            <div style={{ fontSize: '14px', color: '#78350f', lineHeight: '1.6' }}>
                                {currentEvaluation.notes}
                            </div>
                        </div>
                    )}
                </div>
            ) : (
                <div style={{
                    marginBottom: '40px',
                    padding: '24px',
                    textAlign: 'center',
                    color: '#9ca3af',
                    fontStyle: 'italic'
                }}>
                    No evaluation available for current month
                </div>
            )}

            {/* Performance Comparison Chart */}
            <div style={{
                border: '2px solid #e5e7eb',
                borderRadius: '12px',
                padding: '24px',
                backgroundColor: '#f9fafb'
            }}>
                <h3 style={{
                    fontSize: '22px',
                    fontWeight: 'bold',
                    color: '#374151',
                    marginBottom: '20px',
                    textAlign: 'center'
                }}>
                    3-Month Performance Comparison
                </h3>

                <div style={{ height: '400px' }}>
                    <Bar data={chartData} options={chartOptions} />
                </div>
            </div>

            {/* Footer */}
            <div style={{
                marginTop: '40px',
                paddingTop: '20px',
                borderTop: '2px solid #e5e7eb',
                textAlign: 'center',
                color: '#6b7280',
                fontSize: '12px'
            }}>
                <p>This is an automated evaluation report. For questions, contact HR department.</p>
            </div>
        </div>
    );
};



export default Monthly;