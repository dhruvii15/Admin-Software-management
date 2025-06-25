import React, { useEffect, useState } from "react";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import "react-datepicker/dist/react-datepicker.css";
import axios from "axios";

const Dashboard = () => {

    const [stats, setStats] = useState({
        employeeCount: 0,
        internCount: 0,
        hiringCount: 0
    });

    const fetchData = async () => {
        try {
            const response = await axios.get("https://backend-software-management.onrender.com/api/employee/dashboard"); // Change URL as per your API
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

    return (
        <div>
            <PageBreadcrumb pageTitle="Dashboard" />

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8 mt-4">

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
                            <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Total Interns</p>
                            <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats.internCount}</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white dark:bg-[#1F2635] rounded-xl shadow-lg p-6 border-l-4 border-blue-500 hover:shadow-xl transition-shadow duration-300">
                    <div className="flex items-center">
                        <div>
                            <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Total Candidates</p>
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
