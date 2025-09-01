import React, { useEffect, useState } from "react";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import "react-datepicker/dist/react-datepicker.css";
import axios from "axios";
import { useNavigate } from "react-router";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faAward, faPersonCirclePlus, faUser } from "@fortawesome/free-solid-svg-icons";

const Dashboard = () => {
    const navigate = useNavigate();

    const [stats, setStats] = useState({
        employeeCount: 0,
        internCount: 0,
        hiringCount: 0
    });

    const fetchData = async () => {
        try {
            const response = await axios.get("http://localhost:5005/api/plexus/employee/dashboard"); // Change URL as per your API
            console.log(response.data);

            if (response.data.status === "Success!") {
                setStats({
                    employeeCount: response.data.data.employeeCount || 0,
                    internCount: response.data.data.internCount || 0,
                    hiringCount: response.data.data.hiringCount || 0
                });
            } else {
                toast.error("Failed to fetch dashboard data");
            }
        } catch (error) {
            console.error(error);
            toast.error("Something went wrong!");
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleShareClick = () => navigate("/management/employee/data");
    const handleShareClick2 = () => navigate("/management/hiring/data");
    const handleShareClick3 = () => navigate("/management/employee/data");

    return (
        <div>
            <PageBreadcrumb pageTitle="Management Dashboard" />

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8 mt-4">

                <div
                    onClick={handleShareClick3}
                    className="bg-white dark:bg-[#1F2635] rounded-xl shadow-lg p-6 border-l-4 border-purple-500 hover:shadow-xl transition-shadow duration-300 cursor-pointer"
                >
                    <div className="flex items-center">
                        <div className="p-2 bg-white rounded-lg shadow-md mr-4 w-12 h-12 flex items-center justify-center">
                            <FontAwesomeIcon icon={faUser} className="text-purple-500 text-xl" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Total Employees</p>
                            <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats.employeeCount}</p>
                        </div>
                    </div>
                </div>

                <div
                    onClick={handleShareClick}
                    className="bg-white dark:bg-[#1F2635] rounded-xl shadow-lg p-6 border-l-4 border-green-500 hover:shadow-xl transition-shadow duration-300 cursor-pointer"
                >
                    <div className="flex items-center">
                        <div className="p-2 bg-white rounded-lg shadow-md mr-4 w-12 h-12 flex items-center justify-center">
                            <FontAwesomeIcon icon={faPersonCirclePlus} className="text-green-500 text-xl" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Total Interns</p>
                            <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats.internCount}</p>
                        </div>
                    </div>
                </div>

                <div
                    onClick={handleShareClick2}
                    className="bg-white dark:bg-[#1F2635] rounded-xl shadow-lg p-6 border-l-4 border-blue-500 hover:shadow-xl transition-shadow duration-300 cursor-pointer"
                >
                    <div className="flex items-center">
                        <div className="p-2 bg-white rounded-lg shadow-md mr-4 w-12 h-12 flex items-center justify-center">
                            <FontAwesomeIcon icon={faAward} className="text-blue-500 text-xl" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Total Interview Candidates</p>
                            <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats.hiringCount}</p>
                        </div>
                    </div>
                </div>

            </div>


            <ToastContainer position="top-center" className="!z-[99999]" />
        </div>
    );
};

export default Dashboard;
