import React, { useState } from "react";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import "react-datepicker/dist/react-datepicker.css";
import All from "./All";
import Schedule from "./Schedule";
import Complete from "./Complete";

const HiringResume = () => {
    const [activeTab, setActiveTab] = useState("all");

    // Function to render the appropriate component based on active tab
    const renderTabContent = () => {
        switch (activeTab) {
            case "all":
                return <All />;
            case "schedule":
                return <Schedule />;
            case "complete":
                return <Complete />;
            default:
                return null;
        }
    };


    return (
        <div>
            <PageBreadcrumb pageTitle="Hiring Resume Management" />

            {/* Tab Buttons */}
            <div className="flex rounded-lg mb-6 w-full bg-gray-100 gap-5 ps-3 dark:bg-gray-800">
                <button
                    className={`py-3 px-6 font-medium text-base w-1/2 transition-all duration-300 ${activeTab === "all"
                        ? "bg-[#0777AB] text-[#fff] dark:bg-[#0777AB] dark:text-white rounded-lg scale-105"
                        : "text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
                        }`}
                    onClick={() => setActiveTab("all")}
                >
                    All Resume
                </button>
                <button
                    className={`py-3 px-6 font-medium text-base w-1/2 transition-all duration-300 ${activeTab === "schedule"
                        ? "bg-[#0777AB] text-[#fff] dark:bg-[#0777AB] dark:text-white rounded-lg scale-105"
                        : "text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
                        }`}
                    onClick={() => setActiveTab("schedule")}
                >
                    Interview Schedule
                </button>
                <button
                    className={`py-3 px-6 font-medium text-base w-1/2 transition-all duration-300 ${activeTab === "complete"
                        ? "bg-[#0777AB] text-[#fff] dark:bg-[#0777AB] dark:text-white rounded-lg scale-105"
                        : "text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
                        }`}
                    onClick={() => setActiveTab("complete")}
                >
                    Interview Complete
                </button>
            </div>

            {/* Render the component based on active tab */}
            {renderTabContent()}

            <ToastContainer position="top-center" className="!z-[99999]" />
        </div>
    );
};

export default HiringResume;