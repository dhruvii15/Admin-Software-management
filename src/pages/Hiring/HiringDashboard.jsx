import React, { useCallback, useEffect, useState } from "react";
import axios from "axios";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import { Button } from "react-bootstrap";
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlus, faEye, faUsers } from "@fortawesome/free-solid-svg-icons";
import { useNavigate } from "react-router-dom";

const HiringDashboard = () => {
    const [loading, setLoading] = useState(true);
    const [positionStats, setPositionStats] = useState([]);
    const [filteredData, setFilteredData] = useState([]);
    const navigate = useNavigate();

    // Get color from localStorage or generate and store
    const getFixedColor = (position) => {
        const storedColors = JSON.parse(localStorage.getItem('positionColors')) || {};
        if (storedColors[position]) {
            return storedColors[position];
        }

        const colors = [
            'bg-[#14B8A6]', 'bg-[#06B6D4]', 'bg-[#EAB308]', 'bg-[#A855F7]',
        ];

        // Filter out already used colors
        const usedColors = Object.values(storedColors);
        const availableColors = colors.filter(color => !usedColors.includes(color));
        const color = availableColors.length > 0
            ? availableColors[Math.floor(Math.random() * availableColors.length)]
            : colors[Math.floor(Math.random() * colors.length)]; // fallback

        storedColors[position] = color;
        localStorage.setItem('positionColors', JSON.stringify(storedColors));
        return color;
    };

    // Get data from API
    const getData = useCallback(async () => {
        try {
            setLoading(true);
            const response = await axios.get('https://api.pslink.world/api/plexus/hiringresume/read');
            const data = response.data.data;

            setFilteredData(data);

            // Create position statistics
            const positionCounts = data.reduce((acc, item) => {
                if (item.position) {
                    acc[item.position] = (acc[item.position] || 0) + 1;
                }
                return acc;
            }, {});

            const positionStatsArray = Object.entries(positionCounts).map(([position, count]) => ({
                position,
                count,
                color: getFixedColor(position)
            }));
            setPositionStats(positionStatsArray);
        } catch (err) {
            console.error(err);
            toast.error("Failed to fetch hiring data.");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        getData();
    }, [getData]);

    const handlePositionClick = (position) => {
        // Navigate to hiring resume component with selected position
        navigate('/management/hiring-resume', { state: { selectedPosition: position } });
    };

    const handleAddCandidate = () => {
        // Navigate to hiring resume component for adding new candidate
        navigate('/management/hiring-resume', { state: { addMode: true } });
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
        <div>
            <PageBreadcrumb pageTitle="Hiring Dashboard" />
            <div className="space-y-6 sticky left-0">
                <div
                    className={`rounded-2xl overflow-auto border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] transition-all duration-500 ease-in-out`}
                    style={{ minHeight: "600px" }}
                >
                    {/* Card Header */}
                    <div className="px-6">
                        <div className="flex justify-between items-center px-4 py-3 mt-4 dark:border-gray-800 border-gray-200 dark:text-gray-200">
                            <div>
                                <h1 className="text-2xl font-[600] text-gray-800 dark:text-gray-200">
                                   Positions Overview
                                </h1>
                            </div>
                            <div className="flex gap-3">
                                <Button
                                    onClick={handleAddCandidate}
                                    className="rounded-md border-0 shadow-md px-4 py-2 text-white"
                                    style={{ background: "#0777AB" }}
                                >
                                    <FontAwesomeIcon icon={faPlus} className='pe-2' /> Add Candidate
                                </Button>
                            </div>
                        </div>
                    </div>

                    {/* Card Body */}
                    <div className="p-4 border-gray-100 dark:border-gray-800 sm:p-6 overflow-auto">
                        {/* Position Boxes View */}
                        <div className="transform transition-all duration-500 ease-in-out">
                            {positionStats.length > 0 ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                    {positionStats.map((stat, index) => (
                                        <div
                                            key={index}
                                            onClick={() => handlePositionClick(stat.position)}
                                            className={`${stat.color} rounded-xl p-6 text-white cursor-pointer transform transition-all duration-300 hover:scale-[1.01] hover:shadow-md hover:-translate-y-1`}
                                            style={{
                                                animationDelay: `${index * 100}ms`,
                                                animation: 'fadeInUp 0.6s ease-out forwards'
                                            }}
                                        >
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <h3 className="text-lg font-semibold mb-2 truncate">
                                                        {stat.position}
                                                    </h3>
                                                    <div className="flex items-center">
                                                        <FontAwesomeIcon icon={faUsers} className="mr-2" />
                                                        <span className="text-2xl font-bold">{stat.count}</span>
                                                    </div>
                                                    <p className="text-sm opacity-90 mt-1">
                                                        {stat.count === 1 ? 'Candidate' : 'Candidates'}
                                                    </p>
                                                </div>
                                                <div className="text-right">
                                                    <div className="w-12 h-12 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                                                        <FontAwesomeIcon icon={faEye} className="text-xl" />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-12">
                                    <div className="text-gray-400 text-6xl mb-4">
                                        <FontAwesomeIcon icon={faUsers} />
                                    </div>
                                    <h3 className="text-lg font-medium text-gray-500 dark:text-gray-400 mb-2">
                                        No Positions Available
                                    </h3>
                                    <p className="text-gray-400 dark:text-gray-500 mb-4">
                                        Add some candidates to see position statistics
                                    </p>
                                    <Button
                                        onClick={handleAddCandidate}
                                        className="rounded-md border-0 shadow-md px-4 py-2 text-white"
                                        style={{ background: "#0777AB" }}
                                    >
                                        <FontAwesomeIcon icon={faPlus} className='pe-2' /> Add First Candidate
                                    </Button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <ToastContainer position="top-center" className="!z-[99999]" />
        </div>
    );
};

export default HiringDashboard;