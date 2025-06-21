import React, { useEffect, useRef, useState } from "react";
import axios from "axios";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import { Table, TableBody, TableCell, TableHeader, TableRow } from "../../components/ui/table";
import { Button } from "react-bootstrap";
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {faEdit, faPlus, faTrash } from "@fortawesome/free-solid-svg-icons";

const Intern = () => {
    const [visible, setVisible] = useState(false);
    const [id, setId] = useState();
    const [loading, setLoading] = useState(true);
    const [errors, setErrors] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isOpen2, setIsOpen2] = useState(false);
    const [filteredData, setFilteredData] = useState([]);
    const dropdownRef = useRef(null);

    // Form state for intern data - Updated to match your schema
    const [formData, setFormData] = useState({
        name: '',
        position: '',
        birthdate: '',
        joindate: '',
        timeperiod: '',
        phonenumber: '',
        email: ''
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
                    position: '',
                    birthdate: '',
                    joindate: '',
                    timeperiod: '',
                    phonenumber: '',
                    email: ''
                });
                setId(undefined);
            }
            setErrors({});
            setVisible(!visible);
        }
    };

    // API calls - Update these URLs to your intern API endpoints
    const getData = async (page = 1) => {
        try {
            setLoading(true);
            // Replace with your intern API endpoint
            const response = await axios.get('http://localhost:5005/api/employee/intern/read');
            setFilteredData(response.data.data);
        } catch (err) {
            console.error(err);
            toast.error("Failed to fetch intern data.");
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

        // All 7 fields are compulsory as per your requirement
        if (!formData.name.trim()) newErrors.name = 'Intern name is required';
        if (!formData.position.trim()) newErrors.position = 'Position is required';
        if (!formData.birthdate) newErrors.birthdate = 'Birth date is required';
        if (!formData.joindate) newErrors.joindate = 'Join date is required';
        if (!formData.timeperiod.trim()) newErrors.timeperiod = 'Time period is required';
        if (!formData.phonenumber.trim()) newErrors.phonenumber = 'Phone number is required';
        if (!formData.email.trim()) newErrors.email = 'Email is required';

        // Email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (formData.email && !emailRegex.test(formData.email)) {
            newErrors.email = 'Please enter a valid email address';
        }

        // Phone number validation (basic)
        const phoneRegex = /^\d{10,15}$/;
        if (formData.phonenumber && !phoneRegex.test(formData.phonenumber.replace(/\D/g, ''))) {
            newErrors.phonenumber = 'Please enter a valid phone number';
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
            // Replace with your intern API endpoints
            const endpoint = id
                ? `http://localhost:5005/api/employee/intern/update/${id}`
                : 'http://localhost:5005/api/employee/intern/create';
            const method = id ? 'patch' : 'post';

            const response = await axios[method](endpoint, formData);

            toast.success(response.data.message || (id ? 'Intern updated successfully!' : 'Intern created successfully!'));
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
            position: '',
            birthdate: '',
            joindate: '',
            timeperiod: '',
            phonenumber: '',
            email: ''
        });
        setId(null);
        setErrors({});
        setVisible(false);
    };

    const handleEdit = (intern) => {
        if (!isSubmitting) {
            setFormData({
                name: intern.name || '',
                position: intern.position || '',
                birthdate: intern.birthdate || '',
                joindate: intern.joindate || '',
                timeperiod: intern.timeperiod || '',
                phonenumber: intern.phonenumber || '',
                email: intern.email || ''
            });
            setId(intern._id);
            setVisible(true);
        }
    };

    const handleDelete = async (id) => {
        if (!isSubmitting && window.confirm("Are you sure you want to delete this intern?")) {
            try {
                setIsSubmitting(true);
                // Replace with your intern API endpoint
                const response = await axios.delete(`http://localhost:5005/api/employee/intern/delete/${id}`);
                toast.success(response.data.message || 'Intern deleted successfully!');
                getData();
            } catch (err) {
                console.error(err);
                toast.error(err.response?.data?.message || "An error occurred. Please try again.");
            } finally {
                setIsSubmitting(false);
            }
        }
    };

    const handleCopyToClipboard = (text) => {
        navigator.clipboard.writeText(text)
            .then(() => {
                toast.success("Copied to clipboard!");
            })
            .catch(() => {
                toast.error("Failed to copy!");
            });
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
                                        <FontAwesomeIcon icon={faPlus} className='pe-2' /> Add Intern
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
                                        <TableCell isHeader className="py-7 font-medium text-gray-500 dark:text-gray-300 px-2 border-r border-gray-200 dark:border-gray-700">Name</TableCell>
                                        <TableCell isHeader className="py-7 font-medium text-gray-500 dark:text-gray-300 px-2 border-r border-gray-200 dark:border-gray-700">Position</TableCell>
                                        <TableCell isHeader className="py-7 font-medium text-gray-500 dark:text-gray-300 px-2 border-r border-gray-200 dark:border-gray-700">Birth Date</TableCell>
                                        <TableCell isHeader className="py-7 font-medium text-gray-500 dark:text-gray-300 px-2 border-r border-gray-200 dark:border-gray-700">Join Date</TableCell>
                                        <TableCell isHeader className="py-7 font-medium text-gray-500 dark:text-gray-300 px-2 border-r border-gray-200 dark:border-gray-700">Time Period</TableCell>
                                        <TableCell isHeader className="py-7 font-medium text-gray-500 dark:text-gray-300 px-2 border-r border-gray-200 dark:border-gray-700">Phone</TableCell>
                                        <TableCell isHeader className="py-7 font-medium text-gray-500 dark:text-gray-300 px-2 border-r border-gray-200 dark:border-gray-700">Email</TableCell>
                                        <TableCell isHeader className="py-7 font-medium text-gray-500 dark:text-gray-300 px-2 border-r border-gray-200 dark:border-gray-700">Actions</TableCell>
                                    </TableRow>
                                </TableHeader>
                                <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05] text-center">
                                    {currentItems.length > 0 ? (
                                        currentItems.map((intern, index) => (
                                            <TableRow key={intern._id}>
                                                <TableCell className="text-center px-2 border-r border-gray-200 dark:border-gray-700 dark:text-gray-200">
                                                    {index + 1}
                                                </TableCell>
                                                <TableCell className="py-3 px-2 border-r border-gray-200 dark:border-gray-700 dark:text-gray-200">
                                                    {intern.name}
                                                </TableCell>
                                                <TableCell className="py-3 px-2 border-r border-gray-200 dark:border-gray-700 dark:text-gray-200">
                                                    {intern.position}
                                                </TableCell>
                                                <TableCell className="py-3 px-2 border-r border-gray-200 dark:border-gray-700 dark:text-gray-200">
                                                    {new Date(intern.birthdate).toLocaleDateString()}
                                                </TableCell>
                                                <TableCell className="py-3 px-2 border-r border-gray-200 dark:border-gray-700 dark:text-gray-200">
                                                    {new Date(intern.joindate).toLocaleDateString()}
                                                </TableCell>
                                                <TableCell className="py-3 px-2 border-r border-gray-200 dark:border-gray-700 dark:text-gray-200">
                                                    {intern.timeperiod}
                                                </TableCell>
                                                <TableCell className="py-3 px-2 border-r border-gray-200 dark:border-gray-700 dark:text-gray-200">
                                                    {intern.phonenumber}
                                                </TableCell>
                                                <TableCell className="py-3 px-2 border-r border-gray-200 dark:border-gray-700 dark:text-gray-200">
                                                    {intern.email}
                                                </TableCell>
                                                <TableCell className="py-3 px-2 border-r border-gray-200 dark:border-gray-700 dark:text-gray-200">
                                                    <div className="flex align-middle justify-center gap-4">
                                                        <button style={{ color: "#0385C3" }} onClick={() => handleEdit(intern)}>
                                                            <FontAwesomeIcon icon={faEdit} className="text-lg" />
                                                        </button>
                                                        <button className="text-red-600" onClick={() => handleDelete(intern._id)}>
                                                            <FontAwesomeIcon icon={faTrash} className="text-lg" />
                                                        </button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan={9} className="text-center pt-5 pb-4 dark:text-gray-200">No Data Found</td>
                                        </tr>
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </div>
                </div>
            </div>

            {/* Modal for Add/Edit Intern */}
            {visible && (
                <div className="fixed inset-0 z-99999 flex items-center justify-center">
                    {/* Modal Backdrop */}
                    <div
                        className="fixed inset-0 bg-black bg-opacity-50"
                        onClick={() => !isSubmitting && toggleModal('add')}
                    ></div>

                    {/* Modal Content */}
                    <div className="relative bg-white rounded-lg w-full max-w-2xl mx-4 dark:bg-gray-800 dark:text-gray-200 max-h-[90vh] overflow-y-auto">
                        {/* Header */}
                        <div className="px-6 py-4 border-b">
                            <h3 className="text-xl font-semibold">
                                {id ? "Edit Intern" : "Add Intern"}
                            </h3>
                        </div>

                        {/* Body */}
                        <div className="px-6 py-4">
                            <form onSubmit={handleSubmit}>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {/* Name */}
                                    <div className="mb-4">
                                        <label className="block font-medium mb-2">
                                            Intern Name
                                            <span className="text-red-500 pl-2 font-normal text-lg">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            name="name"
                                            value={formData.name}
                                            onChange={handleInputChange}
                                            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white ${errors.name ? 'border-red-500' : 'border-gray-300'
                                                }`}
                                            placeholder="Enter intern name"
                                            disabled={isSubmitting}
                                        />
                                        {errors.name && (
                                            <p className="text-red-500 text-sm mt-1">{errors.name}</p>
                                        )}
                                    </div>

                                    {/* Position */}
                                    <div className="mb-4">
                                        <label className="block font-medium mb-2">
                                            Position
                                            <span className="text-red-500 pl-2 font-normal text-lg">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            name="position"
                                            value={formData.position}
                                            onChange={handleInputChange}
                                            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white ${errors.position ? 'border-red-500' : 'border-gray-300'
                                                }`}
                                            placeholder="Enter position"
                                            disabled={isSubmitting}
                                        />
                                        {errors.position && (
                                            <p className="text-red-500 text-sm mt-1">{errors.position}</p>
                                        )}
                                    </div>

                                    {/* Birth Date */}
                                    <div className="mb-4">
                                        <label className="block font-medium mb-2">
                                            Birth Date
                                            <span className="text-red-500 pl-2 font-normal text-lg">*</span>
                                        </label>
                                        <input
                                            type="date"
                                            name="birthdate"
                                            value={formData.birthdate}
                                            onChange={handleInputChange}
                                            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white ${errors.birthdate ? 'border-red-500' : 'border-gray-300'
                                                }`}
                                            disabled={isSubmitting}
                                        />
                                        {errors.birthdate && (
                                            <p className="text-red-500 text-sm mt-1">{errors.birthdate}</p>
                                        )}
                                    </div>

                                    {/* Join Date */}
                                    <div className="mb-4">
                                        <label className="block font-medium mb-2">
                                            Join Date
                                            <span className="text-red-500 pl-2 font-normal text-lg">*</span>
                                        </label>
                                        <input
                                            type="date"
                                            name="joindate"
                                            value={formData.joindate}
                                            onChange={handleInputChange}
                                            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white ${errors.joindate ? 'border-red-500' : 'border-gray-300'
                                                }`}
                                            disabled={isSubmitting}
                                        />
                                        {errors.joindate && (
                                            <p className="text-red-500 text-sm mt-1">{errors.joindate}</p>
                                        )}
                                    </div>

                                    {/* Time Period */}
                                    <div className="mb-4">
                                        <label className="block font-medium mb-2">
                                            Time Period
                                            <span className="text-red-500 pl-2 font-normal text-lg">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            name="timeperiod"
                                            value={formData.timeperiod}
                                            onChange={handleInputChange}
                                            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white ${errors.timeperiod ? 'border-red-500' : 'border-gray-300'
                                                }`}
                                            placeholder="e.g., 3 months, 6 months"
                                            disabled={isSubmitting}
                                        />
                                        {errors.timeperiod && (
                                            <p className="text-red-500 text-sm mt-1">{errors.timeperiod}</p>
                                        )}
                                    </div>

                                    {/* Phone Number */}
                                    <div className="mb-4">
                                        <label className="block font-medium mb-2">
                                            Phone Number
                                            <span className="text-red-500 pl-2 font-normal text-lg">*</span>
                                        </label>
                                        <input
                                            type="tel"
                                            name="phonenumber"
                                            value={formData.phonenumber}
                                            onChange={handleInputChange}
                                            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white ${errors.phonenumber ? 'border-red-500' : 'border-gray-300'
                                                }`}
                                            placeholder="Enter phone number"
                                            disabled={isSubmitting}
                                        />
                                        {errors.phonenumber && (
                                            <p className="text-red-500 text-sm mt-1">{errors.phonenumber}</p>
                                        )}
                                    </div>

                                    {/* Email */}
                                    <div className="mb-4">
                                        <label className="block font-medium mb-2">
                                            Email
                                            <span className="text-red-500 pl-2 font-normal text-lg">*</span>
                                        </label>
                                        <input
                                            type="email"
                                            name="email"
                                            value={formData.email}
                                            onChange={handleInputChange}
                                            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white ${errors.email ? 'border-red-500' : 'border-gray-300'
                                                }`}
                                            placeholder="Enter email address"
                                            disabled={isSubmitting}
                                        />
                                        {errors.email && (
                                            <p className="text-red-500 text-sm mt-1">{errors.email}</p>
                                        )}
                                    </div>
                                </div>

                                {/* Action Buttons */}
                                <div className="flex gap-4 mt-4">
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

export default Intern;