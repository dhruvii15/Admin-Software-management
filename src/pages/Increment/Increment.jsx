import React, { useState, useEffect, useRef } from "react";
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import * as Chart from 'chart.js';

// Register Chart.js components
Chart.Chart.register(
    Chart.CategoryScale,
    Chart.LinearScale,
    Chart.PointElement,
    Chart.LineElement,
    Chart.BarElement,
    Chart.Title,
    Chart.Tooltip,
    Chart.Legend,
    Chart.Filler,
    Chart.ArcElement
);

const Increment = () => {
    const [employees, setEmployees] = useState([]);
    const [selectedEmployee, setSelectedEmployee] = useState(null);
    const [showAddEvaluation, setShowAddEvaluation] = useState(false);
    const [showChart, setShowChart] = useState(false);
    const [loading, setLoading] = useState(true);
    const [evaluations, setEvaluations] = useState({});
    const [currentEvaluation, setCurrentEvaluation] = useState({
        month: new Date().getMonth() + 1,
        year: new Date().getFullYear(),
        work: 0,
        leave: 0,
        time: 0,
        behaviour: 0,
        evaluatedBy: 'HR'
    });

    const lineChartRef = useRef(null);
    const barChartRef = useRef(null);
    const lineChartInstance = useRef(null);
    const barChartInstance = useRef(null);

    useEffect(() => {
        fetchEmployees();
    }, []);

    useEffect(() => {
        if (employees.length > 0) {
            fetchEvaluations();
        }
    }, [employees]);

    const fetchEmployees = async () => {
        try {
            setLoading(true);
            const response = await fetch('http://localhost:5005/api/employee/read');
            const data = await response.json();
            setEmployees(data.data || []);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching employees:', error);
            toast.error("Failed to fetch employees");
            setLoading(false);
        }
    };

    const fetchEvaluations = async () => {
        try {
            const response = await fetch('http://localhost:5005/api/evaluations/read');
            const data = await response.json();

            if (data.success) {
                // Group evaluations by employee ID
                const groupedEvaluations = {};
                data.data.forEach(evaluation => {
                    if (!groupedEvaluations[evaluation.employeeId]) {
                        groupedEvaluations[evaluation.employeeId] = [];
                    }
                    groupedEvaluations[evaluation.employeeId].push(evaluation);
                });
                setEvaluations(groupedEvaluations);
            }
        } catch (error) {
            console.error('Error fetching evaluations:', error);
            toast.error("Failed to fetch evaluations");
        }
    };

    const calculateGrade = (work, leave, time, behaviour) => {
        const average = (work + leave + time + behaviour) / 4;
        if (average >= 95) return { grade: 'A+', color: 'text-green-600', bg: 'bg-green-100' };
        if (average >= 90) return { grade: 'A', color: 'text-green-500', bg: 'bg-green-50' };
        if (average >= 85) return { grade: 'B+', color: 'text-blue-600', bg: 'bg-blue-100' };
        if (average >= 80) return { grade: 'B', color: 'text-blue-500', bg: 'bg-blue-50' };
        if (average >= 75) return { grade: 'C+', color: 'text-yellow-600', bg: 'bg-yellow-100' };
        if (average >= 70) return { grade: 'C', color: 'text-yellow-500', bg: 'bg-yellow-50' };
        return { grade: 'D', color: 'text-red-500', bg: 'bg-red-50' };
    };

    const getChartData = (employeeId) => {
        const empEvals = evaluations[employeeId] || [];

        // Create monthly data structure
        const monthlyData = {};
        for (let month = 1; month <= 12; month++) {
            monthlyData[month] = {
                month: `Month ${month}`,
                work: 0,
                leave: 0,
                time: 0,
                behaviour: 0,
                count: 0
            };
        }

        // Fill in actual evaluation data
        empEvals.forEach(evaluation => {
            const month = evaluation.month;
            if (monthlyData[month]) {
                monthlyData[month].work += evaluation.work;
                monthlyData[month].leave += evaluation.leave;
                monthlyData[month].time += evaluation.time;
                monthlyData[month].behaviour += evaluation.behaviour;
                monthlyData[month].count += 1;
            }
        });

        // Calculate averages for months with evaluations
        return Object.values(monthlyData).map(data => ({
            month: data.month,
            work: data.count > 0 ? Math.round(data.work / data.count) : 0,
            leave: data.count > 0 ? Math.round(data.leave / data.count) : 0,
            time: data.count > 0 ? Math.round(data.time / data.count) : 0,
            behaviour: data.count > 0 ? Math.round(data.behaviour / data.count) : 0,
            average: data.count > 0 ? Math.round((data.work + data.leave + data.time + data.behaviour) / (4 * data.count)) : 0
        }));
    };

    const getYearlyAverage = (employeeId) => {
        const empEvals = evaluations[employeeId] || [];
        if (empEvals.length === 0) return 0;
        const total = empEvals.reduce((sum, evaluation) => sum + evaluation.work + evaluation.leave + evaluation.time + evaluation.behaviour, 0);
        return Math.round(total / (empEvals.length * 4));
    };

    const createLineChart = () => {
        if (!lineChartRef.current || !selectedEmployee) return;

        const chartData = getChartData(selectedEmployee.id);
        const ctx = lineChartRef.current.getContext('2d');

        if (lineChartInstance.current) {
            lineChartInstance.current.destroy();
        }

        lineChartInstance.current = new Chart.Chart(ctx, {
            type: 'line',
            data: {
                labels: chartData.map(d => d.month),
                datasets: [
                    {
                        label: 'Work Performance',
                        data: chartData.map(d => d.work),
                        borderColor: '#3B82F6',
                        backgroundColor: 'rgba(59, 130, 246, 0.1)',
                        borderWidth: 3,
                        fill: false,
                        tension: 0.4
                    },
                    {
                        label: 'Leave Management',
                        data: chartData.map(d => d.leave),
                        borderColor: '#10B981',
                        backgroundColor: 'rgba(16, 185, 129, 0.1)',
                        borderWidth: 3,
                        fill: false,
                        tension: 0.4
                    },
                    {
                        label: 'Time Management',
                        data: chartData.map(d => d.time),
                        borderColor: '#F59E0B',
                        backgroundColor: 'rgba(245, 158, 11, 0.1)',
                        borderWidth: 3,
                        fill: false,
                        tension: 0.4
                    },
                    {
                        label: 'Behaviour',
                        data: chartData.map(d => d.behaviour),
                        borderColor: '#EF4444',
                        backgroundColor: 'rgba(239, 68, 68, 0.1)',
                        borderWidth: 3,
                        fill: false,
                        tension: 0.4
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'top',
                    },
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 100
                    }
                }
            }
        });
    };

    const createBarChart = () => {
        if (!barChartRef.current || !selectedEmployee) return;

        const empEvals = evaluations[selectedEmployee.id] || [];
        const avgWork = Math.round(empEvals.reduce((sum, evaluation) => sum + evaluation.work, 0) / empEvals.length || 0);
        const avgLeave = Math.round(empEvals.reduce((sum, evaluation) => sum + evaluation.leave, 0) / empEvals.length || 0);
        const avgTime = Math.round(empEvals.reduce((sum, evaluation) => sum + evaluation.time, 0) / empEvals.length || 0);
        const avgBehaviour = Math.round(empEvals.reduce((sum, evaluation) => sum + evaluation.behaviour, 0) / empEvals.length || 0);

        const ctx = barChartRef.current.getContext('2d');

        if (barChartInstance.current) {
            barChartInstance.current.destroy();
        }

        barChartInstance.current = new Chart.Chart(ctx, {
            type: 'bar',
            data: {
                labels: ['Work', 'Leave', 'Time', 'Behaviour'],
                datasets: [{
                    label: 'Average Performance',
                    data: [avgWork, avgLeave, avgTime, avgBehaviour],
                    backgroundColor: [
                        'rgba(59, 130, 246, 0.8)',
                        'rgba(16, 185, 129, 0.8)',
                        'rgba(245, 158, 11, 0.8)',
                        'rgba(239, 68, 68, 0.8)'
                    ],
                    borderColor: [
                        '#3B82F6',
                        '#10B981',
                        '#F59E0B',
                        '#EF4444'
                    ],
                    borderWidth: 2,
                    borderRadius: 8
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 100
                    }
                }
            }
        });
    };

    useEffect(() => {
        if (showChart && selectedEmployee) {
            setTimeout(() => {
                createLineChart();
                createBarChart();
            }, 100);
        }

        return () => {
            if (lineChartInstance.current) {
                lineChartInstance.current.destroy();
            }
            if (barChartInstance.current) {
                barChartInstance.current.destroy();
            }
        };
    }, [showChart, selectedEmployee, evaluations]);

    const handleAddEvaluation = async () => {
        if (!selectedEmployee) return;

        try {
            const evaluationData = {
                employeeId: selectedEmployee.id,
                month: currentEvaluation.month,
                year: currentEvaluation.year,
                work: currentEvaluation.work,
                leave: currentEvaluation.leave,
                time: currentEvaluation.time,
                behaviour: currentEvaluation.behaviour,
                evaluatedBy: currentEvaluation.evaluatedBy
            };

            const response = await fetch('http://localhost:5005/api/evaluations/create', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(evaluationData)
            });

            const data = await response.json();

            if (response.status === 201) {
                toast.success("Evaluation added successfully!");

                await fetchEvaluations();
                setShowAddEvaluation(false);
                setCurrentEvaluation({
                    month: new Date().getMonth() + 1,
                    year: new Date().getFullYear(),
                    work: 0,
                    leave: 0,
                    time: 0,
                    behaviour: 0,
                    evaluatedBy: 'HR'
                });
            } else {
                toast.error(data.message || "Failed to add evaluation");
            }
        } catch (error) {
            console.error('Error adding evaluation:', error);
            toast.error("Failed to add evaluation");
        }
    };



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
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
            {/* FontAwesome CSS */}
            <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" />

            <div className="container mx-auto px-4 py-8">
                {/* Header */}
                <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
                                Employee Increment Dashboard
                            </h1>
                            <p className="text-gray-600">Manage employee evaluations and track performance metrics</p>
                        </div>
                        <div className="flex items-center space-x-4">
                            <div className="bg-blue-100 p-3 rounded-full">
                                <i className="fas fa-users text-blue-600 text-2xl"></i>
                            </div>
                            <div className="text-right">
                                <p className="text-2xl font-bold text-gray-900">{employees.length}</p>
                                <p className="text-sm text-gray-500">Total Employees</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                    <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-blue-500">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600 mb-1">Active Employees</p>
                                <p className="text-2xl font-bold text-gray-900">{employees.length}</p>
                            </div>
                            <i className="fas fa-users text-blue-500 text-2xl"></i>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-green-500">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600 mb-1">Avg Performance</p>
                                <p className="text-2xl font-bold text-gray-900">
                                    {employees.length > 0 ? Math.round(employees.reduce((sum, emp) => sum + getYearlyAverage(emp.id), 0) / employees.length) : 0}%
                                </p>
                            </div>
                            <i className="fas fa-chart-line text-green-500 text-2xl"></i>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-yellow-500">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600 mb-1">Evaluations</p>
                                <p className="text-2xl font-bold text-gray-900">{Object.values(evaluations).flat().length}</p>
                            </div>
                            <i className="fas fa-calendar-alt text-yellow-500 text-2xl"></i>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-purple-500">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600 mb-1">Top Performers</p>
                                <p className="text-2xl font-bold text-gray-900">
                                    {employees.filter(emp => getYearlyAverage(emp.id) >= 90).length}
                                </p>
                            </div>
                            <i className="fas fa-trophy text-purple-500 text-2xl"></i>
                        </div>
                    </div>
                </div>

                {/* Employee Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 mb-8">
                    {employees.map(employee => {
                        const yearlyAvg = getYearlyAverage(employee.id);
                        const gradeInfo = calculateGrade(yearlyAvg, yearlyAvg, yearlyAvg, yearlyAvg);

                        return (
                            <div key={employee.id} className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
                                <div className="p-6">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className={`px-3 py-1 rounded-full text-sm font-medium ${gradeInfo.bg} ${gradeInfo.color}`}>
                                            Grade: {gradeInfo.grade}
                                        </div>
                                        <div className="flex space-x-2">
                                            <button
                                                onClick={() => {
                                                    setSelectedEmployee(employee);
                                                    setShowChart(true);
                                                }}
                                                className="p-2 text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
                                            >
                                                <i className="fas fa-eye"></i>
                                            </button>
                                            <button
                                                onClick={() => {
                                                    setSelectedEmployee(employee);
                                                    setShowAddEvaluation(true);
                                                }}
                                                className="p-2 text-green-600 hover:bg-green-50 rounded-full transition-colors"
                                            >
                                                <i className="fas fa-plus"></i>
                                            </button>
                                        </div>
                                    </div>

                                    <div className="text-center mb-4">
                                        <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white text-xl font-bold mx-auto mb-3">
                                            {employee.name.split(' ').map(n => n[0]).join('')}
                                        </div>
                                        <h3 className="text-xl font-bold text-gray-900 mb-1">{employee.name}</h3>
                                        <p className="text-gray-600 text-sm">{employee.position}</p>
                                        <p className="text-gray-500 text-xs">{employee.department}</p>
                                    </div>

                                    <div className="bg-gray-50 rounded-lg p-4">
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-sm text-gray-600">Yearly Average</span>
                                            <span className="text-lg font-bold text-gray-900">{yearlyAvg}%</span>
                                        </div>
                                        <div className="w-full bg-gray-200 rounded-full h-2">
                                            <div
                                                className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-500"
                                                style={{ width: `${yearlyAvg}%` }}
                                            ></div>
                                        </div>
                                    </div>

                                    <div className="mt-4 flex items-center justify-center space-x-4 text-sm">
                                        <div className="flex items-center">
                                            <i className="fas fa-star text-yellow-500 mr-1"></i>
                                            <span className="text-gray-600">{(evaluations[employee.id] || []).length} evaluations</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Add Evaluation Modal */}
                {showAddEvaluation && selectedEmployee && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-99999 p-4">
                        <div className="bg-white rounded shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
                            <div className="p-6">
                                <div className="flex items-center justify-between mb-6">
                                    <h3 className="text-2xl font-bold text-gray-900">Add Evaluation</h3>
                                    <button
                                        onClick={() => setShowAddEvaluation(false)}
                                        className="text-gray-500 hover:text-gray-700 text-xl"
                                    >
                                        <i className="fas fa-times"></i>
                                    </button>
                                </div>

                                <div className="space-y-4">
                                    <div className="text-center p-4 bg-gray-50 rounded-lg">
                                        <h4 className="font-bold text-lg">{selectedEmployee.name}</h4>
                                        <p className="text-gray-600">{selectedEmployee.position}</p>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">Month</label>
                                            <select
                                                value={currentEvaluation.month}
                                                onChange={(e) => setCurrentEvaluation({ ...currentEvaluation, month: parseInt(e.target.value) })}
                                                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            >
                                                {Array.from({ length: 12 }, (_, i) => (
                                                    <option key={i + 1} value={i + 1}>
                                                        {new Date(0, i).toLocaleString('default', { month: 'long' })}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">Year</label>
                                            <input
                                                type="number"
                                                value={currentEvaluation.year}
                                                onChange={(e) => setCurrentEvaluation({ ...currentEvaluation, year: parseInt(e.target.value) })}
                                                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Work Performance (0-100)</label>
                                        <input
                                            type="range"
                                            min="0"
                                            max="100"
                                            value={currentEvaluation.work}
                                            onChange={(e) => setCurrentEvaluation({ ...currentEvaluation, work: parseInt(e.target.value) })}
                                            className="w-full"
                                        />
                                        <div className="flex justify-between text-sm text-gray-600">
                                            <span>0</span>
                                            <span className="font-bold">{currentEvaluation.work}</span>
                                            <span>100</span>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Leave Management (0-100)</label>
                                        <input
                                            type="range"
                                            min="0"
                                            max="100"
                                            value={currentEvaluation.leave}
                                            onChange={(e) => setCurrentEvaluation({ ...currentEvaluation, leave: parseInt(e.target.value) })}
                                            className="w-full"
                                        />
                                        <div className="flex justify-between text-sm text-gray-600">
                                            <span>0</span>
                                            <span className="font-bold">{currentEvaluation.leave}</span>
                                            <span>100</span>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Time Management (0-100)</label>
                                        <input
                                            type="range"
                                            min="0"
                                            max="100"
                                            value={currentEvaluation.time}
                                            onChange={(e) => setCurrentEvaluation({ ...currentEvaluation, time: parseInt(e.target.value) })}
                                            className="w-full"
                                        />
                                        <div className="flex justify-between text-sm text-gray-600">
                                            <span>0</span>
                                            <span className="font-bold">{currentEvaluation.time}</span>
                                            <span>100</span>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Behaviour (0-100)</label>
                                        <input
                                            type="range"
                                            min="0"
                                            max="100"
                                            value={currentEvaluation.behaviour}
                                            onChange={(e) => setCurrentEvaluation({ ...currentEvaluation, behaviour: parseInt(e.target.value) })}
                                            className="w-full"
                                        />
                                        <div className="flex justify-between text-sm text-gray-600">
                                            <span>0</span>
                                            <span className="font-bold">{currentEvaluation.behaviour}</span>
                                            <span>100</span>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Evaluated By</label>
                                        <select
                                            value={currentEvaluation.evaluatedBy}
                                            onChange={(e) => setCurrentEvaluation({ ...currentEvaluation, evaluatedBy: e.target.value })}
                                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        >
                                            <option value="HR">HR</option>
                                            <option value="CEO">CEO</option>
                                        </select>
                                    </div>

                                    <div className="bg-blue-50 p-4 rounded-lg">
                                        <p className="text-sm text-gray-700 mb-2">Current Grade Preview:</p>
                                        <div className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${calculateGrade(currentEvaluation.work, currentEvaluation.leave, currentEvaluation.time, currentEvaluation.behaviour).bg} ${calculateGrade(currentEvaluation.work, currentEvaluation.leave, currentEvaluation.time, currentEvaluation.behaviour).color}`}>
                                            Grade: {calculateGrade(currentEvaluation.work, currentEvaluation.leave, currentEvaluation.time, currentEvaluation.behaviour).grade}
                                        </div>
                                    </div>

                                    <div className="flex space-x-3 pt-4">
                                        <button
                                            onClick={() => setShowAddEvaluation(false)}
                                            className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            onClick={handleAddEvaluation}
                                            className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg hover:from-blue-600 hover:to-purple-600 transition-colors"
                                        >
                                            Add Evaluation
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Chart Modal */}
                {showChart && selectedEmployee && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-99999 p-4">
                        <div className="bg-white rounded-2xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
                            <div className="p-6">
                                <div className="flex items-center justify-between mb-6">
                                    <div>
                                        <h3 className="text-2xl font-bold text-gray-900">{selectedEmployee.name} - Performance Analytics</h3>
                                        <p className="text-gray-600">{selectedEmployee.position} • {selectedEmployee.department}</p>
                                    </div>
                                    <button
                                        onClick={() => setShowChart(false)}
                                        className="text-gray-500 hover:text-gray-700 text-xl"
                                    >
                                        <i className="fas fa-times"></i>
                                    </button>
                                </div>

                                <div className="space-y-8">
                                    {/* Yearly Line Chart */}
                                    <div className="bg-gray-50 rounded-xl p-6">
                                        <h4 className="text-lg font-bold text-gray-900 mb-4">Monthly Performance Trends</h4>
                                        <div style={{ height: '300px' }}>
                                            <canvas ref={lineChartRef}></canvas>
                                        </div>
                                    </div>

                                    {/* Bar Chart */}
                                    <div className="bg-gray-50 rounded-xl p-6">
                                        <h4 className="text-lg font-bold text-gray-900 mb-4">Average Performance by Category</h4>
                                        <div style={{ height: '300px' }}>
                                            <canvas ref={barChartRef}></canvas>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Increment;