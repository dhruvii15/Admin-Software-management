import React, { useState } from "react";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import "react-datepicker/dist/react-datepicker.css";
import Evaluations from "./evaluations";
import Monthly from "./monthly";

const Data = () => {
    const [activeTab, setActiveTab] = useState("dashboard");

    // Function to render the appropriate component based on active tab
    const renderTabContent = () => {
        switch (activeTab) {
            case "dashboard":
                return <Monthly />;
            case "evaluations":
                return <Evaluations />;
            case "monthly":
                return <Monthly />;
            case "yearly":
                return <Evaluations />;
            default:
                return null;
        }
    };


    return (
        <div>
            <PageBreadcrumb pageTitle="Increment Management" />

            {/* Tab Buttons */}
            <div className="flex rounded-lg mb-6 w-full bg-gray-100 gap-5 dark:bg-gray-800">
                <button
                    className={`py-3 px-6 font-medium text-base w-1/2 transition-all duration-300 ${activeTab === "dashboard"
                        ? "bg-[#0777AB] text-[#fff] dark:bg-[#0777AB] dark:text-white rounded-lg scale-105"
                        : "text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
                        }`}
                    onClick={() => setActiveTab("dashboard")}
                >
                    Dashboard
                </button>
                <button
                    className={`py-3 px-6 font-medium text-base w-1/2 transition-all duration-300 ${activeTab === "evaluations"
                        ? "bg-[#0777AB] text-[#fff] dark:bg-[#0777AB] dark:text-white rounded-lg scale-105"
                        : "text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
                        }`}
                    onClick={() => setActiveTab("evaluations")}
                >
                    Evaluations
                </button>
                {/* <button
                    className={`py-3 px-6 font-medium text-base w-1/2 transition-all duration-300 ${activeTab === "monthly"
                        ? "bg-[#0777AB] text-[#fff] dark:bg-[#0777AB] dark:text-white rounded-lg scale-105"
                        : "text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
                        }`}
                    onClick={() => setActiveTab("monthly")}
                >
                    Monthly
                </button>
                <button
                    className={`py-3 px-6 font-medium text-base w-1/2 transition-all duration-300 ${activeTab === "yearly"
                        ? "bg-[#0777AB] text-[#fff] dark:bg-[#0777AB] dark:text-white rounded-lg scale-105"
                        : "text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
                        }`}
                    onClick={() => setActiveTab("yearly")}
                >
                    Yearly
                </button> */}
            </div>

            {/* Render the component based on active tab */}
            {renderTabContent()}

            <ToastContainer position="top-center" className="!z-[99999]" />
        </div>
    );
};

export default Data;