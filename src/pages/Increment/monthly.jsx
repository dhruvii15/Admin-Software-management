import React, { useEffect, useState } from "react";
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';
import { Bar } from 'react-chartjs-2';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCalendar, faUser } from "@fortawesome/free-solid-svg-icons";

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const Monthly = () => {
    const [evaluations, setEvaluations] = useState([]);
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
    const [availableYears, setAvailableYears] = useState([]);
    const [chartData, setChartData] = useState({});
    const [loading, setLoading] = useState(true);
    const [isDarkMode, setIsDarkMode] = useState(false);

    useEffect(() => {
        // Check for dark mode
        const checkDarkMode = () => {
            setIsDarkMode(document.documentElement.classList.contains('dark'));
        };
        checkDarkMode();

        // Listen for theme changes
        const observer = new MutationObserver(checkDarkMode);
        observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });

        fetchData();

        return () => observer.disconnect();
    }, []);

    useEffect(() => {
        if (evaluations.length > 0) {
            processChartData();
        }
    }, [evaluations, selectedYear, isDarkMode]);

    const fetchData = async () => {
        try {
            setLoading(true);
            const response = await fetch("https://backend-software-management.onrender.com/api/evaluations/read");
            const data = await response.json();
            if (data) {
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

    const processChartData = () => {
        const filteredData = evaluations.filter(item => parseInt(item.year) === selectedYear);
        const employeeData = {};
        filteredData.forEach(item => {
            const { employeeName, month, overallGrade, evaluatorRole } = item;
            if (!employeeData[employeeName]) employeeData[employeeName] = {};
            if (!employeeData[employeeName][month]) employeeData[employeeName][month] = {};
            employeeData[employeeName][month][evaluatorRole] = gradeToNumber(overallGrade);
        });

        const processedData = {};
        Object.keys(employeeData).forEach(employeeName => {
            const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
            const hrData = [];
            const adminData = [];
            for (let month = 1; month <= 12; month++) {
                const monthStr = month.toString();
                hrData.push(employeeData[employeeName][monthStr]?.hr || 0);
                adminData.push(employeeData[employeeName][monthStr]?.admin || 0);
            }
            processedData[employeeName] = {
                labels: months,
                datasets: [
                    {
                        label: 'HR Evaluation',
                        data: hrData,
                        backgroundColor: isDarkMode ? 'rgba(191, 131, 255, 0.8)' : 'rgba(191, 131, 255, 0.7)',
                        borderColor: isDarkMode ? 'rgba(191, 131, 255, 1)' : 'rgba(139, 69, 255, 1)',
                        borderWidth: 2,
                        borderRadius: 8,
                        borderSkipped: false,
                        hoverBackgroundColor: isDarkMode ? 'rgba(191, 131, 255, 0.95)' : 'rgba(139, 69, 255, 0.85)',
                        hoverBorderColor: isDarkMode ? 'rgba(191, 131, 255, 1)' : 'rgba(139, 69, 255, 1)',
                        hoverBorderWidth: 3
                    },
                    {
                        label: 'Admin Evaluation',
                        data: adminData,
                        backgroundColor: isDarkMode ? 'rgba(34, 197, 94, 0.8)' : 'rgba(34, 197, 94, 0.7)',
                        borderColor: isDarkMode ? 'rgba(34, 197, 94, 1)' : 'rgba(22, 163, 74, 1)',
                        borderWidth: 2,
                        borderRadius: 8,
                        borderSkipped: false,
                        hoverBackgroundColor: isDarkMode ? 'rgba(34, 197, 94, 0.95)' : 'rgba(22, 163, 74, 0.85)',
                        hoverBorderColor: isDarkMode ? 'rgba(34, 197, 94, 1)' : 'rgba(22, 163, 74, 1)',
                        hoverBorderWidth: 3
                    }
                ]
            };
        });
        setChartData(processedData);
    };

    const getEmployeeStats = () => {
        const filteredData = evaluations.filter(item => parseInt(item.year) === selectedYear);
        const uniqueEmployees = new Set(filteredData.map(item => item.employeeName));
        const totalEvaluations = filteredData.length;
        const avgGrade = filteredData.reduce((sum, item) => sum + gradeToNumber(item.overallGrade), 0) / filteredData.length;
        return {
            employeeCount: uniqueEmployees.size,
            totalEvaluations,
            avgGrade: avgGrade ? avgGrade.toFixed(1) : 0
        };
    };

    const getChartOptions = (employeeName) => ({
        responsive: true,
        maintainAspectRatio: false,
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
                        const gradeMap = { 1: 'D', 2: 'C', 3: 'B', 4: 'A', 0: 'No' };
                        return `${context.dataset.label}: Grade ${gradeMap[context.parsed.y]}`;
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
                    text: 'Months',
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

    const stats = getEmployeeStats();

    if (loading) return (
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
        <div className="min-h-screen p-6 dark:from-gray-900 dark:to-gray-800">
            <div className="max-w-7xl mx-auto">

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                    <div className="bg-white dark:bg-[#1F2635] rounded-xl shadow-lg p-6 border-l-4 border-purple-500 hover:shadow-xl transition-shadow duration-300">
                        <div className="flex items-center">
                            <div>
                                <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Total Employees</p>
                                <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats.employeeCount}</p>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white dark:bg-[#1F2635] rounded-xl shadow-lg p-6 border-l-4 border-green-500 hover:shadow-xl transition-shadow duration-300">
                        <div className="flex items-center">
                            <div>
                                <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Total Evaluations</p>
                                <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats.totalEvaluations}</p>
                            </div>
                        </div>
                    </div>
                </div>

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
                            className="px-4 py-2 border min-w-32 text-gray-800 dark:text-gray-200 border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 bg-white dark:bg-[#1F2635] shadow-sm hover:shadow-md transition-shadow duration-200 font-medium"
                        >
                            {availableYears.map((year) => (
                                <option key={year} value={year}>
                                    {year}
                                </option>
                            ))}
                        </select>
                    </div>
                )}


                <div className="space-y-8">
                    {Object.keys(chartData).map(employeeName => (
                        <div key={employeeName} className="bg-white dark:bg-[#1F2635] rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300 p-8 border border-gray-100 dark:border-gray-700">
                            <div className="mb-6">
                                <h2 className="text-2xl font-bold text-[#0777AB] dark:text-purple-400 mb-2 capitalize">
                                    {employeeName}
                                </h2>
                                <p className="text-gray-600 dark:text-gray-400 font-medium">
                                    Performance Overview - {selectedYear}
                                </p>
                            </div>

                            <div className="h-96">
                                <Bar
                                    data={chartData[employeeName]}
                                    options={getChartOptions(employeeName)}
                                />
                            </div>
                        </div>
                    ))}

                    {Object.keys(chartData).length === 0 && (
                        <div className="bg-white dark:bg-[#1F2635] rounded-xl shadow-lg p-12 text-center border border-gray-100 dark:border-gray-700">
                            <div className="text-gray-400 dark:text-gray-500 mb-4 text-4xl">
                                <FontAwesomeIcon icon={faUser} />
                            </div>
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

            <ToastContainer
                position="top-center"
                className="!z-[99999]"
                toastClassName="!bg-white dark:!bg-gray-800 !text-gray-800 dark:!text-gray-200 !shadow-lg !border !border-gray-200 dark:!border-gray-600"
            />
        </div>
    );
};

export default Monthly;