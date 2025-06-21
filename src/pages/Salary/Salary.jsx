import React from "react";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const Salary = () => {
    return (
        <div>
            <PageBreadcrumb pageTitle="Salary Management" />


            <ToastContainer position="top-center" className="!z-[99999]" />
        </div>
    );
};

export default Salary;