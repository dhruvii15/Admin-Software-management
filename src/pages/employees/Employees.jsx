import React, { useEffect, useRef, useState } from "react";
import axios from "axios";
import { Table, TableBody, TableCell, TableHeader, TableRow } from "../../components/ui/table";
import { Button } from "react-bootstrap";
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {faEdit, faPlus, faTrash } from "@fortawesome/free-solid-svg-icons";

const Employees = () => {
    const [visible, setVisible] = useState(false);
    const [id, setId] = useState();
    const [loading, setLoading] = useState(true);
    const [errors, setErrors] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isOpen2, setIsOpen2] = useState(false);
    const [filteredData, setFilteredData] = useState([]);
    const dropdownRef = useRef(null);

    // Form state for employee data
    const [formData, setFormData] = useState({
        name: '',
        position: '',
        salary: '',
        birthdate: '',
        joindate: '',
        completedate: '',
        increameentdate: '',
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
                    salary: '',
                    birthdate: '',
                    joindate: '',
                    completedate: '',
                    increameentdate: '',
                    phonenumber: '',
                    email: ''
                });
                setId(undefined);
            }
            setErrors({});
            setVisible(!visible);
        }
    };

    // API calls - Update these URLs to your employee API endpoints
    const getData = async (page = 1) => {
        try {
            setLoading(true);
            // Replace with your employee API endpoint
            const response = await axios.get('https://backend-software-management.onrender.com/api/employee/read');
            setFilteredData(response.data.data);
        } catch (err) {
            console.error(err);
            toast.error("Failed to fetch employee data.");
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

        if (!formData.name.trim()) newErrors.name = 'Employee name is required';
        if (!formData.position.trim()) newErrors.position = 'Position is required';
        if (!formData.salary.trim()) newErrors.salary = 'Salary is required';
        if (!formData.birthdate) newErrors.birthdate = 'Birth date is required';
        if (!formData.joindate) newErrors.joindate = 'Join date is required';
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
            // Replace with your employee API endpoints
            const endpoint = id
                ? `https://backend-software-management.onrender.com/api/employee/update/${id}`
                : 'https://backend-software-management.onrender.com/api/employee/create';
            const method = id ? 'patch' : 'post';

            const response = await axios[method](endpoint, formData);

            toast.success(response.data.message);
            resetForm();
            getData();
        } catch (err) {
            console.error(err);
            toast.error("An error occurred. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const resetForm = () => {
        setFormData({
            name: '',
            position: '',
            salary: '',
            birthdate: '',
            joindate: '',
            completedate: '',
            increameentdate: '',
            phonenumber: '',
            email: ''
        });
        setId(null);
        setErrors({});
        setVisible(false);
    };

    const handleEdit = (employee) => {
        if (!isSubmitting) {
            setFormData({
                name: employee.name || '',
                position: employee.position || '',
                salary: employee.salary || '',
                birthdate: employee.birthdate || '',
                joindate: employee.joindate || '',
                completedate: employee.completedate || '',
                increameentdate: employee.increameentdate || '',
                phonenumber: employee.phonenumber || '',
                email: employee.email || ''
            });
            setId(employee._id);
            setVisible(true);
        }
    };

    const handleDelete = async (id) => {
        if (!isSubmitting && window.confirm("Are you sure you want to delete this employee?")) {
            try {
                setIsSubmitting(true);
                // Replace with your employee API endpoint
                const response = await axios.delete(`https://backend-software-management.onrender.com/api/employee/delete/${id}`);
                toast.success(response.data.message);
                getData();
            } catch (err) {
                console.error(err);
                toast.error("An error occurred. Please try again.");
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
                                        <FontAwesomeIcon icon={faPlus} className='pe-2' /> Add Employee
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
                                        <TableCell isHeader className="py-7 font-medium text-gray-500 dark:text-gray-300 px-2 border-r border-gray-200 dark:border-gray-700">Salary</TableCell>
                                        <TableCell isHeader className="py-7 font-medium text-gray-500 dark:text-gray-300 px-2 border-r border-gray-200 dark:border-gray-700">Phone</TableCell>
                                        <TableCell isHeader className="py-7 font-medium text-gray-500 dark:text-gray-300 px-2 border-r border-gray-200 dark:border-gray-700">Email</TableCell>
                                        <TableCell isHeader className="py-7 font-medium text-gray-500 dark:text-gray-300 px-2 border-r border-gray-200 dark:border-gray-700">Birth Date</TableCell>
                                        <TableCell isHeader className="py-7 font-medium text-gray-500 dark:text-gray-300 px-2 border-r border-gray-200 dark:border-gray-700">Join Date</TableCell>
                                        <TableCell isHeader className="py-7 font-medium text-gray-500 dark:text-gray-300 px-2 border-r border-gray-200 dark:border-gray-700">Complete Date</TableCell>
                                        <TableCell isHeader className="py-7 font-medium text-gray-500 dark:text-gray-300 px-2 border-r border-gray-200 dark:border-gray-700">Increament Date</TableCell>
                                        <TableCell isHeader className="py-7 font-medium text-gray-500 dark:text-gray-300 px-2 border-r border-gray-200 dark:border-gray-700">Actions</TableCell>
                                    </TableRow>
                                </TableHeader>
                                <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05] text-center">
                                    {currentItems.length > 0 ? (
                                        currentItems.map((employee, index) => (
                                            <TableRow key={employee._id}>
                                                <TableCell className="text-center px-2 border-r border-gray-200 dark:border-gray-700 dark:text-gray-200">
                                                    {index + 1}
                                                </TableCell>
                                                <TableCell className="py-3 px-2 border-r border-gray-200 dark:border-gray-700 dark:text-gray-200">
                                                    {employee.name}
                                                </TableCell>
                                                <TableCell className="py-3 px-2 border-r border-gray-200 dark:border-gray-700 dark:text-gray-200">
                                                    {employee.position}
                                                </TableCell>
                                                <TableCell className="py-3 px-2 border-r border-gray-200 dark:border-gray-700 dark:text-gray-200">
                                                    {employee.salary}
                                                </TableCell>
                                                <TableCell className="py-3 px-2 border-r border-gray-200 dark:border-gray-700 dark:text-gray-200 ">
                                                    {employee.phonenumber}
                                                </TableCell>
                                                <TableCell className="py-3 px-2 border-r border-gray-200 dark:border-gray-700 dark:text-gray-200">
                                                    {employee.email}
                                                </TableCell>
                                                <TableCell className="py-3 px-2 border-r border-gray-200 dark:border-gray-700 dark:text-gray-200">
                                                    {new Date(employee.birthdate).toLocaleDateString()}
                                                </TableCell>
                                                <TableCell className="py-3 px-2 border-r border-gray-200 dark:border-gray-700 dark:text-gray-200">
                                                    {new Date(employee.joindate).toLocaleDateString()}
                                                </TableCell>
                                                <TableCell className="py-3 px-2 border-r border-gray-200 dark:border-gray-700 dark:text-gray-200">
                                                    {new Date(employee.completedate).toLocaleDateString()}
                                                </TableCell>
                                                <TableCell className="py-3 px-2 border-r border-gray-200 dark:border-gray-700 dark:text-gray-200">
                                                    {new Date(employee.increameentdate).toLocaleDateString()}
                                                </TableCell>
                                                <TableCell className="py-3 px-2 border-r border-gray-200 dark:border-gray-700 dark:text-gray-200">
                                                    <div className="flex align-middle justify-center gap-4">
                                                        <button style={{ color: "#0385C3" }} onClick={() => handleEdit(employee)}>
                                                            <FontAwesomeIcon icon={faEdit} className="text-lg" />
                                                        </button>
                                                        <button className="text-red-600" onClick={() => handleDelete(employee._id)}>
                                                            <FontAwesomeIcon icon={faTrash} className="text-lg" />
                                                        </button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan={11} className="text-center pt-5 pb-4 dark:text-gray-200">No Data Found</td>
                                        </tr>
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </div>
                </div>
            </div>

            {/* Modal for Add/Edit Employee */}
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
                                {id ? "Edit Employee" : "Add Employee"}
                            </h3>
                        </div>

                        {/* Body */}
                        <div className="px-6 py-4">
                            <form onSubmit={handleSubmit}>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {/* Name */}
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

                                    {/* Salary */}
                                    <div className="mb-4">
                                        <label className="block font-medium mb-2">
                                            Salary
                                            <span className="text-red-500 pl-2 font-normal text-lg">*</span>
                                        </label>
                                        <input
                                            type="number"
                                            name="salary"
                                            value={formData.salary}
                                            onChange={handleInputChange}
                                            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white ${errors.salary ? 'border-red-500' : 'border-gray-300'
                                                }`}
                                            placeholder="Enter salary"
                                            disabled={isSubmitting}
                                        />
                                        {errors.salary && (
                                            <p className="text-red-500 text-sm mt-1">{errors.salary}</p>
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

                                    {/* Complete Date */}
                                    <div className="mb-4">
                                        <label className="block font-medium mb-2">
                                            Complete Date
                                        </label>
                                        <input
                                            type="date"
                                            name="completedate"
                                            value={formData.completedate}
                                            onChange={handleInputChange}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                            disabled={isSubmitting}
                                        />
                                    </div>

                                    {/* Increment Date */}
                                    <div className="mb-4">
                                        <label className="block font-medium mb-2">
                                            Increment Date
                                        </label>
                                        <input
                                            type="date"
                                            name="increameentdate"
                                            value={formData.increameentdate}
                                            onChange={handleInputChange}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                            disabled={isSubmitting}
                                        />
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
                                            type="text"
                                            name="email"
                                            value={formData.email}
                                            onChange={handleInputChange}
                                            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white ${errors.phonenumber ? 'border-red-500' : 'border-gray-300'
                                                }`}
                                            placeholder="Enter phone number"
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

export default Employees;