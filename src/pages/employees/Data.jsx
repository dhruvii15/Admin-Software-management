import React, { useState } from "react";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import "react-datepicker/dist/react-datepicker.css";
import Employees from "./Employees";
import Intern from "./Intern";

const Data = () => {
    const [activeTab, setActiveTab] = useState("employees");

    // Function to render the appropriate component based on active tab
    const renderTabContent = () => {
        switch (activeTab) {
            case "employees":
                return <Employees />;
            case "intern":
                return <Intern />;
            default:
                return null;
        }
    };


    return (
        <div>
            <PageBreadcrumb pageTitle="Employees Management" />

            {/* Tab Buttons */}
            <div className="flex rounded-lg mb-6 w-full bg-gray-100 gap-5 ps-3 dark:bg-gray-800">
                <button
                    className={`py-3 px-6 font-medium text-base w-1/2 transition-all duration-300 ${activeTab === "employees"
                        ? "bg-[#0777AB] text-[#fff] dark:bg-[#0777AB] dark:text-white rounded-lg scale-105"
                        : "text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
                        }`}
                    onClick={() => setActiveTab("employees")}
                >
                    Employees
                </button>
                <button
                    className={`py-3 px-6 font-medium text-base w-1/2 transition-all duration-300 ${activeTab === "intern"
                        ? "bg-[#0777AB] text-[#fff] dark:bg-[#0777AB] dark:text-white rounded-lg scale-105"
                        : "text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
                        }`}
                    onClick={() => setActiveTab("intern")}
                >
                    Intern
                </button>
            </div>

            {/* Render the component based on active tab */}
            {renderTabContent()}

            <ToastContainer position="top-center" className="!z-[99999]" />
        </div>
    );
};

export default Data;