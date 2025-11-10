import React, { useEffect, useRef, useState } from "react";
import axios from "axios";
import { Table, TableBody, TableCell, TableHeader, TableRow } from "../../components/ui/table";
import { Button } from "react-bootstrap";
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEdit, faPlus, faTrash } from "@fortawesome/free-solid-svg-icons";
import { Swiper, SwiperSlide } from 'swiper/react';
import 'swiper/css';

const Employees = () => {
    const [visible, setVisible] = useState(false);
    const [id, setId] = useState();
    const [loading, setLoading] = useState(true);
    const [errors, setErrors] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isOpen2, setIsOpen2] = useState(false);
    const [filteredData, setFilteredData] = useState([]);
    const dropdownRef = useRef(null);
    const [positions, setPositions] = useState([]);
    const [showPositionInput, setShowPositionInput] = useState(false);

    const handlePositionSelect = (position) => {
        setFormData(prev => ({
            ...prev,
            position: position
        }));
        setIsOpen2(false);

        // Clear error for position field
        if (errors.position) {
            setErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors.position;
                return newErrors;
            });
        }
    };


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
        email: '',
        photos: [] // Add this line
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
                    email: '',
                    photos: [] // Add this line
                });
                setId(undefined);
            }
            setErrors({});
            setShowPositionInput(false);
            setVisible(!visible);
        }
    };

    // API calls - Update these URLs to your employee API endpoints
    const getData = async (page = 1) => {
        try {
            setLoading(true);
            // Replace with your employee API endpoint
            const response = await axios.get('http://localhost:5005/api/plexus/employee/read');
            setFilteredData(response.data.data);
            const data = response.data.data
            const uniquePositions = [...new Set(data.map(item => item.position).filter(Boolean))];
            setPositions(uniquePositions);
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

    const handlePhotoChange = (e) => {
        const files = Array.from(e.target.files);
        if (files.length + formData.photos.length > 3) {
            toast.error('Maximum 3 photos allowed');
            return;
        }

        const newPhotos = [];
        files.forEach(file => {
            const reader = new FileReader();
            reader.onload = (event) => {
                newPhotos.push({
                    file: file,
                    preview: event.target.result,
                    name: file.name
                });

                if (newPhotos.length === files.length) {
                    setFormData(prev => ({
                        ...prev,
                        photos: [...prev.photos, ...newPhotos]
                    }));

                    // Clear error for photos field
                    if (errors.photos) {
                        setErrors(prev => {
                            const newErrors = { ...prev };
                            delete newErrors.photos;
                            return newErrors;
                        });
                    }
                }
            };
            reader.readAsDataURL(file);
        });
    };

    const removePhoto = (index) => {
        setFormData(prev => ({
            ...prev,
            photos: prev.photos.filter((_, i) => i !== index)
        }));
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

            // Create FormData for file upload
            const formDataToSend = new FormData();

            // Add all form fields
            Object.keys(formData).forEach(key => {
                if (key !== 'photos') {
                    formDataToSend.append(key, formData[key]);
                }
            });

            // Add photos
            formData.photos.forEach((photo, index) => {
                if (photo.file) {
                    formDataToSend.append('photos', photo.file);
                }
            });

            const endpoint = id
                ? `http://localhost:5005/api/plexus/employee/update/${id}`
                : 'http://localhost:5005/api/plexus/employee/create';
            const method = id ? 'patch' : 'post';

            const response = await axios[method](endpoint, formDataToSend, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });

            toast.success(response.data.message);
            resetForm();
            getData();
        } catch (err) {
            console.error(err);
            toast.error("An error occurred. Please try again.");
        } finally {
            setIsSubmitting(false);
            setIsOpen2(false);
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
            email: '',
            photos: [] // Add this line
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
                email: employee.email || '',
                photos: employee.photos || [] // Add this line
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
                const response = await axios.delete(`http://localhost:5005/api/plexus/employee/delete/${id}`);
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
                                        <TableCell isHeader className="py-7 font-medium text-gray-500 dark:text-gray-300 px-2 border-r border-gray-200 dark:border-gray-700">Photos</TableCell>
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
                                                <TableCell className="py-3 px-2 border-r border-gray-200 dark:border-gray-700 dark:text-gray-200 w-24">
                                                    {employee.photos && employee.photos.length > 0 ? (
                                                        <div className="w-12 h-12 mx-auto">
                                                            <Swiper
                                                                spaceBetween={5}
                                                                slidesPerView={1}
                                                                loop={true}
                                                                autoplay={{ delay: 100 }}
                                                            >
                                                                {employee.photos.map((photo, index) => {
                                                                    const photoUrl = typeof photo === 'string' ? photo : photo.preview;
                                                                    return (
                                                                        <SwiperSlide key={index}>
                                                                            <img
                                                                                src={photoUrl}
                                                                                alt={`Employee ${index}`}
                                                                                className="w-12 h-12 object-cover rounded-full cursor-pointer border border-gray-300 shadow bg-gray-200"
                                                                                onClick={() => window.open(photoUrl, '_blank')}
                                                                            />
                                                                        </SwiperSlide>
                                                                    );
                                                                })}
                                                            </Swiper>
                                                        </div>
                                                    ) : (
                                                        '-'
                                                    )}
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
                                                <TableCell
                                                    className="py-3 px-2 border-r border-gray-200 dark:border-gray-700 dark:text-gray-200"
                                                    style={{
                                                        minWidth: "80px",
                                                        width: "80px",
                                                        maxWidth: "80px",
                                                        wordBreak: "break-word",
                                                        overflowWrap: "break-word",
                                                        whiteSpace: "normal",
                                                        display: "table-cell",
                                                    }}
                                                >
                                                    <div style={{ wordBreak: "break-word", overflowWrap: "break-word", whiteSpace: "normal" }}>
                                                        {employee.email}
                                                    </div>
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

                                        {positions.length > 0 && !showPositionInput ? (
                                            <div className="relative" ref={dropdownRef}>
                                                <div
                                                    onClick={() => !isSubmitting && setIsOpen2(!isOpen2)}
                                                    className={`w-full px-3 py-2 border rounded-lg cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white ${errors.position ? 'border-red-500' : 'border-gray-300'
                                                        }`}
                                                >
                                                    {formData.position || "Select position"}
                                                </div>
                                                {isOpen2 && (
                                                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg dark:bg-gray-700 dark:border-gray-600">
                                                        {positions.map((position, index) => (
                                                            <div
                                                                key={index}
                                                                onClick={() => handlePositionSelect(position)}
                                                                className="px-3 py-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
                                                            >
                                                                {position}
                                                            </div>
                                                        ))}
                                                        <div
                                                            onClick={() => setShowPositionInput(true)}
                                                            className="px-3 py-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 border-t"
                                                        >
                                                            + Add new position
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        ) : (
                                            <div>
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
                                                {positions.length > 0 && (
                                                    <button
                                                        type="button"
                                                        onClick={() => setShowPositionInput(false)}
                                                        className="text-sm text-[#0777AB] mt-1"
                                                    >
                                                        Choose from existing positions
                                                    </button>
                                                )}
                                            </div>
                                        )}

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
                                            placeholder="Enter email"
                                            disabled={isSubmitting}
                                        />
                                        {errors.email && (
                                            <p className="text-red-500 text-sm mt-1">{errors.email}</p>
                                        )}
                                    </div>

                                    {/* Photos */}
                                    <div className="mb-4 md:col-span-2">
                                        <label className="block font-medium mb-3 text-gray-700 dark:text-gray-200">
                                            Employee Photos
                                            <span className="text-red-500 ml-1 font-normal">*</span>
                                            <span className="text-sm font-normal text-gray-500 ml-2">(Maximum 3 photos)</span>
                                        </label>

                                        {/* Upload Area */}
                                        <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-6 bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                                            {formData.photos.length < 3 ? (
                                                <div className="text-center">
                                                    <div className="mb-4">
                                                        <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                                                            <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                                        </svg>
                                                    </div>
                                                    <input
                                                        type="file"
                                                        accept="image/*"
                                                        multiple
                                                        onChange={handlePhotoChange}
                                                        className="hidden"
                                                        id="photo-upload"
                                                        disabled={isSubmitting}
                                                    />
                                                    <label
                                                        htmlFor="photo-upload"
                                                        className="cursor-pointer inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                                                    >
                                                        <svg className="mr-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                                        </svg>
                                                        Choose Photos
                                                    </label>
                                                    <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                                                        PNG, JPG, GIF up to 10MB each
                                                    </p>
                                                </div>
                                            ) : (
                                                <div className="text-center text-gray-500 dark:text-gray-400">
                                                    <svg className="mx-auto h-8 w-8 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                                                    </svg>
                                                    <p className="text-sm font-medium">Maximum photos reached</p>
                                                </div>
                                            )}
                                        </div>

                                        {/* Photo Preview Grid */}
                                        {formData.photos.length > 0 && (
                                            <div className="mt-4">
                                                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-200 mb-3">
                                                    Uploaded Photos ({formData.photos.length}/3)
                                                </h4>
                                                <div className="grid grid-cols-3 gap-4">
                                                    {formData.photos.map((photo, index) => (
                                                        <div
                                                            key={index}
                                                            className="relative group bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-600 overflow-hidden hover:shadow-md transition-shadow"
                                                        >
                                                            <div className="aspect-square">
                                                                <img
                                                                    src={typeof photo === 'string' ? photo : photo.preview}
                                                                    alt={`Preview ${index + 1}`}
                                                                    className="w-full h-full object-cover cursor-pointer hover:scale-105 transition-transform"
                                                                    onClick={() => window.open(typeof photo === 'string' ? photo : photo.preview, '_blank')}
                                                                />
                                                            </div>

                                                            {/* Overlay with actions */}
                                                            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all flex items-center justify-center">
                                                                <div className="opacity-0 group-hover:opacity-100 transition-opacity flex space-x-2">

                                                                    <button
                                                                        type="button"
                                                                        onClick={() => removePhoto(index)}
                                                                        className="p-1 bg-red-500 rounded-full shadow-md hover:bg-red-600 transition-colors"
                                                                        disabled={isSubmitting}
                                                                        title="Remove photo"
                                                                    >
                                                                        <svg className="h-4 w-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                                        </svg>
                                                                    </button>
                                                                </div>
                                                            </div>

                                                            {/* Photo number indicator */}
                                                            <div className="absolute top-2 left-2 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded">
                                                                {index + 1}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {/* Progress indicator */}
                                        <div className="mt-3 flex items-center justify-between">
                                            <div className="flex items-center space-x-2">
                                                <div className="flex space-x-1">
                                                    {[1, 2, 3].map((num) => (
                                                        <div
                                                            key={num}
                                                            className={`w-2 h-2 rounded-full ${num <= formData.photos.length
                                                                ? 'bg-blue-500'
                                                                : 'bg-gray-300 dark:bg-gray-600'
                                                                }`}
                                                        />
                                                    ))}
                                                </div>
                                                <span className="text-sm text-gray-500 dark:text-gray-400">
                                                    {formData.photos.length} of 3 photos
                                                </span>
                                            </div>

                                            {formData.photos.length > 0 && (
                                                <button
                                                    type="button"
                                                    onClick={() => setFormData(prev => ({ ...prev, photos: [] }))}
                                                    className="text-sm text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 font-medium"
                                                    disabled={isSubmitting}
                                                >
                                                    Clear all
                                                </button>
                                            )}
                                        </div>

                                        {errors.photos && (
                                            <div className="mt-2 flex items-center space-x-1">
                                                <svg className="h-4 w-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                </svg>
                                                <p className="text-red-500 text-sm">{errors.photos}</p>
                                            </div>
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