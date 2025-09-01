import React, { useEffect, useRef, useState } from "react";
import axios from "axios";
import { Table, TableBody, TableCell, TableHeader, TableRow } from "../../components/ui/table";
import { Button } from "react-bootstrap";
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEdit, faPlus, faTrash } from "@fortawesome/free-solid-svg-icons";

const Leave = () => {
    const [visible, setVisible] = useState(false);
    const [id, setId] = useState();
    const [loading, setLoading] = useState(true);
    const [errors, setErrors] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isOpen2, setIsOpen2] = useState(false);
    const [filteredData, setFilteredData] = useState([]);
    const dropdownRef = useRef(null);

    // Form state for leave data
    const [formData, setFormData] = useState({
        name: '',
        startDate: '',
        endDate: '',
        reason: ''
    });

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen2(false);
            }
        };

        if (isOpen2) {
            document.addEventListener("mousedown", handleClickOutside);
        }

        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [isOpen2]);

    const toggleModal = (mode) => {
        if (!isSubmitting) {
            if (mode === 'add') {
                setFormData({
                    name: '',
                    startDate: '',
                    endDate: '',
                    reason: ''
                });
                setId(undefined);
            }
            setErrors({});
            setVisible(!visible);
        }
    };

    // API calls for leave management
    const getData = async (page = 1) => {
        try {
            setLoading(true);
            // Replace with your leave API endpoint
            const response = await axios.get('https://api.pslink.world/api/plexus/leave/read');
            setFilteredData(response.data.data);
        } catch (err) {
            console.error(err);
            toast.error("Failed to fetch leave data.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        getData();
    }, []);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));

        // Clear error for this field when user starts typing
        if (errors[name]) {
            setErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors[name];
                return newErrors;
            });
        }
    };

    const currentItems = filteredData;

    const validate = () => {
        const newErrors = {};

        // All fields validation
        if (!formData.name.trim()) newErrors.name = 'Employee name is required';
        if (!formData.startDate) newErrors.startDate = 'Start date is required';
        if (!formData.reason.trim()) newErrors.reason = 'Leave reason is required';

        // Date validation - should not be in the past
        const startDate = new Date(formData.startDate);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        startDate.setHours(0, 0, 0, 0);

        // End date validation (if provided)
        if (formData.endDate) {
            const endDate = new Date(formData.endDate);
            endDate.setHours(0, 0, 0, 0);

            if (formData.startDate && endDate < startDate) {
                newErrors.endDate = 'End date cannot be before start date';
            }
        }

        return newErrors;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const validationErrors = validate();

        if (Object.keys(validationErrors).length > 0) {
            setErrors(validationErrors);
            return;
        }

        try {
            setIsSubmitting(true);
            // Replace with your leave API endpoints
            const endpoint = id
                ? `https://api.pslink.world/api/plexus/leave/update/${id}`
                : 'https://api.pslink.world/api/plexus/leave/create';
            const method = id ? 'patch' : 'post';

            const response = await axios[method](endpoint, formData);

            toast.success(response.data.message || (id ? 'Leave updated successfully!' : 'Leave created successfully!'));
            resetForm();
            getData();
        } catch (err) {
            console.error(err);
            toast.error(err.response?.data?.message || "An error occurred. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const resetForm = () => {
        setFormData({
            name: '',
            startDate: '',
            endDate: '',
            reason: ''
        });
        setId(null);
        setErrors({});
        setVisible(false);
    };

    const handleEdit = (leave) => {
        if (!isSubmitting) {
            setFormData({
                name: leave.name || '',
                startDate: leave.startDate || '',
                endDate: leave.endDate || '',
                reason: leave.reason || ''
            });
            setId(leave._id);
            setVisible(true);
        }
    };

    const handleDelete = async (id) => {
        if (!isSubmitting && window.confirm("Are you sure you want to delete this leave record?")) {
            try {
                setIsSubmitting(true);
                // Replace with your leave API endpoint
                const response = await axios.delete(`https://api.pslink.world/api/plexus/leave/delete/${id}`);
                toast.success(response.data.message || 'Leave deleted successfully!');
                getData();
            } catch (err) {
                console.error(err);
                toast.error(err.response?.data?.message || "An error occurred. Please try again.");
            } finally {
                setIsSubmitting(false);
            }
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
        <div>
            <div className="space-y-6 sticky left-0">
                <div
                    className={`rounded-2xl overflow-auto border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]`}
                    style={{ minHeight: "600px" }}
                >
                    {/* Card Header */}
                    <div className="px-6 pt-5">
                        <div className="flex justify-between items-center px-4 py-3 mt-4 dark:border-gray-800 border-gray-200">
                            <div className="flex justify-end">
                                <div className="flex items-center gap-2">
                                    <Button
                                        onClick={() => toggleModal('add')}
                                        className="rounded-md border-0 shadow-md px-4 py-2 text-white"
                                        style={{ background: "#0777AB" }}
                                    >
                                        <FontAwesomeIcon icon={faPlus} className='pe-2' /> Add Leave
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Card Body */}
                    <div className="p-4 border-gray-100 dark:border-gray-800 sm:p-6 overflow-auto">
                        <div className="space-y-6 rounded-lg xl:border dark:border-gray-800">
                            <Table>
                                <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
                                    <TableRow>
                                        <TableCell isHeader className="py-4 font-medium text-gray-500 dark:text-gray-300 px-2 border-r border-gray-200 dark:border-gray-700">Index</TableCell>
                                        <TableCell isHeader className="py-7 font-medium text-gray-500 dark:text-gray-300 px-2 border-r border-gray-200 dark:border-gray-700">Employee Name</TableCell>
                                        <TableCell isHeader className="py-7 font-medium text-gray-500 dark:text-gray-300 px-2 border-r border-gray-200 dark:border-gray-700">Leave Period</TableCell>
                                        <TableCell isHeader className="py-7 font-medium text-gray-500 dark:text-gray-300 px-2 border-r border-gray-200 dark:border-gray-700">Leave Reason</TableCell>
                                        <TableCell isHeader className="py-7 font-medium text-gray-500 dark:text-gray-300 px-2 border-r border-gray-200 dark:border-gray-700">Actions</TableCell>
                                    </TableRow>
                                </TableHeader>
                                <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05] text-center">
                                    {currentItems.length > 0 ? (
                                        currentItems.map((leave, index) => (
                                            <TableRow key={leave._id}>
                                                <TableCell className="text-center px-2 border-r border-gray-200 dark:border-gray-700 dark:text-gray-200">
                                                    {index + 1}
                                                </TableCell>
                                                <TableCell className="py-3 px-2 border-r border-gray-200 dark:border-gray-700 dark:text-gray-200">
                                                    {leave.name}
                                                </TableCell>
                                                <TableCell className="py-3 px-2 border-r border-gray-200 dark:border-gray-700 dark:text-gray-200">
                                                    {leave.endDate ?
                                                        `${new Date(leave.startDate).toLocaleDateString()} to ${new Date(leave.endDate).toLocaleDateString()}` :
                                                        new Date(leave.startDate).toLocaleDateString()
                                                    }
                                                </TableCell>
                                                <TableCell className="py-3 px-2 border-r border-gray-200 dark:border-gray-700 dark:text-gray-200">
                                                    {leave.reason}
                                                </TableCell>
                                                <TableCell className="py-3 px-2 border-r border-gray-200 dark:border-gray-700 dark:text-gray-200">
                                                    <div className="flex align-middle justify-center gap-4">
                                                        <button style={{ color: "#0385C3" }} onClick={() => handleEdit(leave)}>
                                                            <FontAwesomeIcon icon={faEdit} className="text-lg" />
                                                        </button>
                                                        <button className="text-red-600" onClick={() => handleDelete(leave._id)}>
                                                            <FontAwesomeIcon icon={faTrash} className="text-lg" />
                                                        </button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan={5} className="text-center pt-5 pb-4 dark:text-gray-200">No Data Found</td>
                                        </tr>
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </div>
                </div>
            </div>

            {/* Modal for Add/Edit Leave */}
            {visible && (
                <div className="fixed inset-0 z-99999 flex items-center justify-center">
                    {/* Modal Backdrop */}
                    <div
                        className="fixed inset-0 bg-black bg-opacity-50"
                        onClick={() => !isSubmitting && toggleModal('add')}
                    ></div>

                    {/* Modal Content */}
                    <div className="relative bg-white rounded-lg w-full max-w-lg mx-4 dark:bg-gray-800 dark:text-gray-200 max-h-[90vh] overflow-y-auto">
                        {/* Header */}
                        <div className="px-6 py-4 border-b">
                            <h3 className="text-xl font-semibold">
                                {id ? "Edit Leave" : "Add Leave"}
                            </h3>
                        </div>

                        {/* Body */}
                        <div className="px-6 py-4">
                            <form onSubmit={handleSubmit}>
                                <div className="space-y-4">
                                    {/* Employee Name */}
                                    <div className="mb-4">
                                        <label className="block font-medium mb-2">
                                            Employee Name
                                            <span className="text-red-500 pl-2 font-normal text-lg">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            name="name"
                                            value={formData.name}
                                            onChange={handleInputChange}
                                            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white ${errors.name ? 'border-red-500' : 'border-gray-300'
                                                }`}
                                            placeholder="Enter employee name"
                                            disabled={isSubmitting}
                                        />
                                        {errors.name && (
                                            <p className="text-red-500 text-sm mt-1">{errors.name}</p>
                                        )}
                                    </div>

                                    {/* Leave Date */}
                                    {/* Start Date */}
                                    <div className="mb-4">
                                        <label className="block font-medium mb-2">
                                            Start Date
                                            <span className="text-red-500 pl-2 font-normal text-lg">*</span>
                                        </label>
                                        <input
                                            type="date"
                                            name="startDate"
                                            value={formData.startDate}
                                            onChange={handleInputChange}
                                            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white ${errors.startDate ? 'border-red-500' : 'border-gray-300'}`}
                                            disabled={isSubmitting}
                                        />
                                        {errors.startDate && (
                                            <p className="text-red-500 text-sm mt-1">{errors.startDate}</p>
                                        )}
                                    </div>

                                    {/* End Date */}
                                    <div className="mb-4">
                                        <label className="block font-medium mb-2">
                                            End Date
                                            <span className="text-gray-500 text-sm">(Optional)</span>
                                        </label>
                                        <input
                                            type="date"
                                            name="endDate"
                                            value={formData.endDate}
                                            onChange={handleInputChange}
                                            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white ${errors.endDate ? 'border-red-500' : 'border-gray-300'}`}
                                            disabled={isSubmitting}
                                        />
                                        {errors.endDate && (
                                            <p className="text-red-500 text-sm mt-1">{errors.endDate}</p>
                                        )}
                                    </div>

                                    {/* Leave Reason */}
                                    <div className="mb-4">
                                        <label className="block font-medium mb-2">
                                            Leave Reason
                                            <span className="text-red-500 pl-2 font-normal text-lg">*</span>
                                        </label>
                                        <textarea
                                            name="reason"
                                            value={formData.reason}
                                            onChange={handleInputChange}
                                            rows={4}
                                            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white resize-none ${errors.reason ? 'border-red-500' : 'border-gray-300'
                                                }`}
                                            placeholder="Enter leave reason"
                                            disabled={isSubmitting}
                                        />
                                        {errors.reason && (
                                            <p className="text-red-500 text-sm mt-1">{errors.reason}</p>
                                        )}
                                    </div>
                                </div>

                                {/* Action Buttons */}
                                <div className="flex gap-4 mt-6">
                                    <button
                                        type="button"
                                        onClick={() => toggleModal()}
                                        disabled={isSubmitting}
                                        className="w-1/2 py-2 px-4 bg-gray-100 text-black rounded-lg hover:bg-gray-200 transition-colors duration-200"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={isSubmitting}
                                        className="w-1/2 py-2 px-4 text-white rounded-lg transition-colors duration-200"
                                        style={{ backgroundColor: "#0777AB" }}
                                    >
                                        {isSubmitting ? (
                                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto"></div>
                                        ) : (
                                            id ? 'Update' : 'Submit'
                                        )}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            <ToastContainer position="top-center" className="!z-[99999]" />
        </div>
    );
};

export default Leave;