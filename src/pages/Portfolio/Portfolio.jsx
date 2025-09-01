import React, { useEffect, useRef, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEdit, faPlus, faTrash } from '@fortawesome/free-solid-svg-icons';
import axios from 'axios';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { toast, ToastContainer } from 'react-toastify';
import { Table, TableBody, TableCell, TableHeader, TableRow } from "../../components/ui/table";
import 'react-toastify/dist/ReactToastify.css';
import { faApple } from '@fortawesome/free-brands-svg-icons';
import { faArrowUpFromBracket } from '@fortawesome/free-solid-svg-icons';

//  img
import play from "../../assest/play.svg"
import CustomPagination from '../../components/common/pagination';
import PageBreadcrumb from '../../components/common/PageBreadCrumb';

const Portfolio = () => {
    const [visible, setVisible] = useState(false);
    const [data, setData] = useState([]);
    const [id, setId] = useState();
    const [loading, setLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const fileInputRef = useRef(null);

    // Pagination states
    const [currentPage, setCurrentPage] = useState(1);
    const [totalItems, setTotalItems] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const itemsPerPage = 15;

    const toggleModal = () => {
        if (!isSubmitting) {
            setVisible(!visible);
            if (visible) {
                formik.resetForm();
                setId(undefined);
            }
        }
    };

    const getData = (page = 1) => {
        setLoading(true);
        axios.post('http://localhost:5005/api/plexus/portfolio/read/admin', { page })
            .then((res) => {
                setData(res.data.data);
                setTotalItems(res.data.totalItems);
                setTotalPages(Math.ceil(res.data.totalItems / itemsPerPage));
                setLoading(false);
            })
            .catch((err) => {
                console.error(err);
                setLoading(false);
                toast.error("Failed to fetch data.");
            });
    };

    const handlePageChange = (page) => {
        if (page > 0 && page <= totalPages) {
            setCurrentPage(page);
            getData(page);
        }
    };

    useEffect(() => {
        getData(currentPage);
    }, []);

    // Fixed validation schema
    const portfolioSchema = Yup.object().shape({
        type: Yup.string()
            .required('Type is required')
            .oneOf(['product', 'client'], 'Type must be either product or client'),

        // Common fields
        description: Yup.string()
            .required('Description is required')
            .min(10, 'Description must be at least 10 characters'),

        // Product specific fields
        country: Yup.string()
            .when('type', {
                is: 'product',
                then: (schema) => schema.required('Country is required'),
                otherwise: (schema) => schema.notRequired()
            }),
        playstoreLink: Yup.string()
            .when('type', {
                is: 'product',
                then: (schema) => schema
                    .url('Must be a valid URL')
                    .required('Playstore link is required'),
                otherwise: (schema) => schema.notRequired()
            }),
        appstoreLink: Yup.string()
            .when('type', {
                is: 'product',
                then: (schema) => schema
                    .url('Must be a valid URL')
                    .required('Appstore link is required'),
                otherwise: (schema) => schema.notRequired()
            }),

        // Client specific fields
        title: Yup.string()
            .when('type', {
                is: 'client',
                then: (schema) => schema
                    .required('Title is required')
                    .min(3, 'Title must be at least 3 characters'),
                otherwise: (schema) => schema.notRequired()
            }),
        image: Yup.mixed()
            .when('type', {
                is: 'client',
                then: (schema) => schema
                    .test('fileRequired', 'Image is required', function (value) {
                        // If editing and no new file selected, check if existing image exists
                        if (id && !value) {
                            // You can add logic here to check if existing image exists
                            // For now, allow null during edit
                            return true;
                        }
                        // If creating new entry, file is required
                        return !!value;
                    }),
                otherwise: (schema) => schema.notRequired()
            }),
        link: Yup.string()
            .when('type', {
                is: 'client',
                then: (schema) => schema
                    .url('Must be a valid URL')
                    .required('Link is required'),
                otherwise: (schema) => schema.notRequired()
            }),
    });

    const formik = useFormik({
        initialValues: {
            type: '',
            description: '',
            // Product fields
            country: '',
            playstoreLink: '',
            appstoreLink: '',
            // Client fields
            title: '',
            image: null,
            link: '',
        },
        validationSchema: portfolioSchema,
        onSubmit: async (values, { setSubmitting, resetForm }) => {
            console.log('Form submitted with values:', values);

            try {
                setIsSubmitting(true);

                // Don't set Content-Type header - let axios handle it for FormData
                const config = {
                    headers: {}
                };

                let requestData;

                if (values.type === 'client') {
                    const formData = new FormData();
                    formData.append('type', values.type);
                    formData.append('description', values.description);
                    formData.append('title', values.title);
                    formData.append('link', values.link);

                    // Only append image if a new file is selected
                    if (values.image) {
                        formData.append('image', values.image);
                    }
                    // If editing without new image, don't append image field
                    // The backend should handle keeping the existing image

                    requestData = formData;
                } else {
                    // For product type, use regular JSON since no file upload
                    requestData = {
                        type: values.type,
                        description: values.description,
                        country: values.country,
                        playstoreLink: values.playstoreLink,
                        appstoreLink: values.appstoreLink
                    };

                    config.headers['Content-Type'] = 'application/json';
                    console.log('JSON data:', requestData);
                }

                const request = id !== undefined
                    ? axios.patch(`http://localhost:5005/api/plexus/portfolio/update/${id}`, requestData, config)
                    : axios.post('http://localhost:5005/api/plexus/portfolio/create', requestData, config);

                const res = await request;
                console.log('Response:', res);

                resetForm();
                setId(undefined);
                getData(currentPage);
                toast.success(res.data.message);
                toggleModal();

            } catch (err) {
                console.error('Submit error:', err);
                if (err.response) {
                    console.error('Error response:', err.response.data);
                    toast.error(err.response.data.message || "An error occurred. Please try again.");
                } else if (err.request) {
                    console.error('No response received:', err.request);
                    toast.error("No response from server. Please check your connection.");
                } else {
                    console.error('Error:', err.message);
                    toast.error("An error occurred. Please try again.");
                }
            } finally {
                setSubmitting(false);
                setIsSubmitting(false);
            }
        },
    });

    const handleEdit = (portfolio) => {
        if (!isSubmitting) {
            const values = {
                type: portfolio.type || 'product',
                description: portfolio.description || '',
                country: portfolio.country || '',
                playstoreLink: portfolio.playstoreLink || '',
                appstoreLink: portfolio.appstoreLink || '',
                title: portfolio.title || '',
                image: portfolio.image[0], // Keep as null for file input
                link: portfolio.link || '',
            };

            formik.setValues(values);
            setId(portfolio._id);
            toggleModal();
        }
    };

    const handleDelete = async (portfolioId) => {
        if (!isSubmitting && window.confirm("Are you sure you want to delete this portfolio?")) {
            try {
                setIsSubmitting(true);
                const res = await axios.delete(`http://localhost:5005/api/plexus/portfolio/delete/${portfolioId}`);
                getData(currentPage);
                toast.success(res.data.message);
            } catch (err) {
                console.error(err);
                toast.error("An error occurred. Please try again.");
            } finally {
                setIsSubmitting(false);
            }
        }
    };

    const handleFileChange = (event) => {
        const file = event.target.files[0];
        console.log('File selected:', file);
        formik.setFieldValue('image', file);
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
            <PageBreadcrumb pageTitle="Portfolio" />

            <div className="bg-white rounded-2xl px-3 py-3 mt-4 dark:border-gray-800 dark:bg-white/[0.03]">
                <div className="flex justify-end py-4 pr-2">
                    <button
                        onClick={toggleModal}
                        className={`px-4 py-2 rounded-lg border-0 text-white font-medium transition-colors ${isSubmitting
                            ? 'opacity-50 cursor-not-allowed'
                            : 'hover:opacity-90'
                            }`}
                        style={{ backgroundColor: "#0777AB" }}
                        disabled={isSubmitting}
                    >
                        <FontAwesomeIcon icon={faPlus} className="pr-2" />Add Portfolio
                    </button>
                </div>

                <div className="transform transition-all duration-500 ease-in-out">
                    <div className="space-y-6 rounded-lg xl:border dark:border-gray-800">
                        <Table>
                            <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
                                <TableRow>
                                    <TableCell isHeader className="py-4 font-medium text-gray-500 dark:text-gray-300 px-2 border-r border-gray-200 dark:border-gray-700">ID</TableCell>
                                    <TableCell isHeader className="py-4 font-medium text-gray-500 dark:text-gray-300 px-2 border-r border-gray-200 dark:border-gray-700">Type</TableCell>
                                    <TableCell isHeader className="py-4 font-medium text-gray-500 dark:text-gray-300 px-2 border-r border-gray-200 dark:border-gray-700">Title</TableCell>
                                    <TableCell isHeader className="py-4 font-medium text-gray-500 dark:text-gray-300 px-2 border-r border-gray-200 dark:border-gray-700">Description</TableCell>
                                    <TableCell isHeader className="py-4 font-medium text-gray-500 dark:text-gray-300 px-2">Actions</TableCell>
                                </TableRow>
                            </TableHeader>

                            <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05] text-center">
                                {data.map((portfolio, index) => (
                                    <TableRow
                                        key={portfolio._id}
                                        className="transform transition-all duration-300 hover:bg-gray-50 dark:hover:bg-gray-800/50"
                                        style={{
                                            animationDelay: `${index * 50}ms`,
                                            animation: 'fadeInLeft 0.4s ease-out forwards'
                                        }}
                                    >
                                        <TableCell className="text-center px-2 border-r border-gray-200 dark:border-gray-700 dark:text-gray-200">
                                            {((currentPage - 1) * itemsPerPage) + index + 1}
                                        </TableCell>
                                        <TableCell className="py-3 px-2 border-r border-gray-200 dark:border-gray-700 dark:text-gray-200">
                                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${portfolio.type === 'product' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300' : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'}`}>
                                                {portfolio.type || 'product'}
                                            </span>
                                        </TableCell>
                                        <TableCell className="py-3 px-2 border-r border-gray-200 dark:border-gray-700 dark:text-gray-200">
                                            {portfolio.title || '-'}
                                        </TableCell>
                                        <TableCell className="py-3 px-2 border-r border-gray-200 dark:border-gray-700 dark:text-gray-200">
                                            {portfolio.description}
                                        </TableCell>
                                        <TableCell className="py-3 px-2 dark:text-gray-200">
                                            <div className="flex justify-center items-center gap-4">
                                                <button
                                                    className="text-[#0385C3] transform transition-all duration-200 hover:scale-110"
                                                    onClick={() => handleEdit(portfolio)}
                                                    disabled={isSubmitting}
                                                >
                                                    <FontAwesomeIcon icon={faEdit} />
                                                </button>
                                                <button
                                                    className="text-red-600 transform transition-all duration-200 hover:scale-110"
                                                    onClick={() => handleDelete(portfolio._id)}
                                                    disabled={isSubmitting}
                                                >
                                                    <FontAwesomeIcon icon={faTrash} />
                                                </button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </div>
            </div>

            {/* Pagination */}
            {totalPages > 0 && (
                <CustomPagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={handlePageChange}
                    itemsPerPage={itemsPerPage}
                    totalItems={totalItems}
                />
            )}

            {/* Modal */}
            {visible && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-99999">
                    <div className="bg-white rounded-lg w-full max-w-xl mx-4 max-h-[90vh] overflow-y-auto dark:bg-gray-800 dark:text-gray-200">
                        <div className="flex justify-between items-center p-4 border-b">
                            <h5 className="text-lg font-semibold">{id ? "Edit Portfolio" : "Add New Portfolio"}</h5>
                        </div>
                        <div className="p-4">
                            <form onSubmit={formik.handleSubmit}>
                                {/* Type Selection */}
                                <div className="mb-3">
                                    <label className="block text-sm font-bold mb-2">
                                        Type<span className="text-red-500 pl-2 font-normal text-base">*</span>
                                    </label>
                                    <select
                                        id="type"
                                        name="type"
                                        onChange={(e) => {
                                            console.log('Type changed to:', e.target.value);
                                            formik.handleChange(e);
                                        }}
                                        onBlur={formik.handleBlur}
                                        value={formik.values.type}
                                        disabled={isSubmitting}
                                        className={`w-full dark:bg-gray-700 dark:border-gray-600 dark:text-white transition-all duration-200 px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${formik.touched.type && !!formik.errors.type
                                            ? 'border-red-500'
                                            : 'border-gray-300'
                                            } ${isSubmitting ? 'bg-gray-100' : ''}`}
                                    >
                                        <option value="">Select Type</option>
                                        <option value="product">Product</option>
                                        <option value="client">Client</option>
                                    </select>
                                    {formik.touched.type && formik.errors.type && (
                                        <div className="text-red-500 text-sm mt-1">
                                            {formik.errors.type}
                                        </div>
                                    )}
                                </div>

                                {/* Product Specific Fields */}
                                {formik.values.type === 'product' && (
                                    <>

                                        {/* Common Description Field */}
                                        <div className="mb-3">
                                            <label className="block text-sm font-bold mb-2">
                                                Description<span className="text-red-500 pl-2 font-normal text-base">*</span>
                                            </label>
                                            <textarea
                                                rows={3}
                                                id="description"
                                                name="description"
                                                onChange={formik.handleChange}
                                                onBlur={formik.handleBlur}
                                                value={formik.values.description}
                                                disabled={isSubmitting}
                                                className={`w-full dark:bg-gray-700 dark:border-gray-600 dark:text-white transition-all duration-200 px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${formik.touched.description && !!formik.errors.description
                                                    ? 'border-red-500'
                                                    : 'border-gray-300'
                                                    } ${isSubmitting ? 'bg-gray-100' : ''}`}
                                            />
                                            {formik.touched.description && formik.errors.description && (
                                                <div className="text-red-500 text-sm mt-1">
                                                    {formik.errors.description}
                                                </div>
                                            )}
                                        </div>

                                        <div className="mb-3">
                                            <label className="block text-sm font-bold mb-2">
                                                Country<span className="text-red-500 pl-2 font-normal text-base">*</span>
                                            </label>
                                            <input
                                                type="text"
                                                id="country"
                                                name="country"
                                                onChange={formik.handleChange}
                                                onBlur={formik.handleBlur}
                                                value={formik.values.country}
                                                disabled={isSubmitting}
                                                className={`w-full dark:bg-gray-700 dark:border-gray-600 dark:text-white transition-all duration-200 px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${formik.touched.country && !!formik.errors.country
                                                    ? 'border-red-500'
                                                    : 'border-gray-300'
                                                    } ${isSubmitting ? 'bg-gray-100' : ''}`}
                                            />
                                            {formik.touched.country && formik.errors.country && (
                                                <div className="text-red-500 text-sm mt-1">
                                                    {formik.errors.country}
                                                </div>
                                            )}
                                        </div>

                                        <div className="mb-3">
                                            <label className="block text-sm font-bold mb-2">
                                                Playstore Link<span className="text-red-500 pl-2 font-normal text-base">*</span>
                                            </label>
                                            <input
                                                type="text"
                                                id="playstoreLink"
                                                name="playstoreLink"
                                                onChange={formik.handleChange}
                                                onBlur={formik.handleBlur}
                                                value={formik.values.playstoreLink}
                                                disabled={isSubmitting}
                                                className={`w-full dark:bg-gray-700 dark:border-gray-600 dark:text-white transition-all duration-200 px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${formik.touched.playstoreLink && !!formik.errors.playstoreLink
                                                    ? 'border-red-500'
                                                    : 'border-gray-300'
                                                    } ${isSubmitting ? 'bg-gray-100' : ''}`}
                                            />
                                            {formik.touched.playstoreLink && formik.errors.playstoreLink && (
                                                <div className="text-red-500 text-sm mt-1">
                                                    {formik.errors.playstoreLink}
                                                </div>
                                            )}
                                        </div>

                                        <div className="mb-3">
                                            <label className="block text-sm font-bold mb-2">
                                                Appstore Link<span className="text-red-500 pl-2 font-normal text-base">*</span>
                                            </label>
                                            <input
                                                type="text"
                                                id="appstoreLink"
                                                name="appstoreLink"
                                                onChange={formik.handleChange}
                                                onBlur={formik.handleBlur}
                                                value={formik.values.appstoreLink}
                                                disabled={isSubmitting}
                                                className={`w-full dark:bg-gray-700 dark:border-gray-600 dark:text-white transition-all duration-200 px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${formik.touched.appstoreLink && !!formik.errors.appstoreLink
                                                    ? 'border-red-500'
                                                    : 'border-gray-300'
                                                    } ${isSubmitting ? 'bg-gray-100' : ''}`}
                                            />
                                            {formik.touched.appstoreLink && formik.errors.appstoreLink && (
                                                <div className="text-red-500 text-sm mt-1">
                                                    {formik.errors.appstoreLink}
                                                </div>
                                            )}
                                        </div>
                                    </>
                                )}

                                {/* Client Specific Fields */}
                                {formik.values.type === 'client' && (
                                    <>

                                        {/* Common Description Field */}
                                        <div className="mb-3">
                                            <label className="block text-sm font-bold mb-2">
                                                Description<span className="text-red-500 pl-2 font-normal text-base">*</span>
                                            </label>
                                            <textarea
                                                rows={3}
                                                id="description"
                                                name="description"
                                                onChange={formik.handleChange}
                                                onBlur={formik.handleBlur}
                                                value={formik.values.description}
                                                disabled={isSubmitting}
                                                className={`w-full dark:bg-gray-700 dark:border-gray-600 dark:text-white transition-all duration-200 px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${formik.touched.description && !!formik.errors.description
                                                    ? 'border-red-500'
                                                    : 'border-gray-300'
                                                    } ${isSubmitting ? 'bg-gray-100' : ''}`}
                                            />
                                            {formik.touched.description && formik.errors.description && (
                                                <div className="text-red-500 text-sm mt-1">
                                                    {formik.errors.description}
                                                </div>
                                            )}
                                        </div>
                                        <div className="mb-3">
                                            <label className="block text-sm font-bold mb-2">
                                                Title<span className="text-red-500 pl-2 font-normal text-base">*</span>
                                            </label>
                                            <input
                                                type="text"
                                                id="title"
                                                name="title"
                                                onChange={formik.handleChange}
                                                onBlur={formik.handleBlur}
                                                value={formik.values.title}
                                                disabled={isSubmitting}
                                                className={`w-full dark:bg-gray-700 dark:border-gray-600 dark:text-white transition-all duration-200 px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${formik.touched.title && !!formik.errors.title
                                                    ? 'border-red-500'
                                                    : 'border-gray-300'
                                                    } ${isSubmitting ? 'bg-gray-100' : ''}`}
                                            />
                                            {formik.touched.title && formik.errors.title && (
                                                <div className="text-red-500 text-sm mt-1">
                                                    {formik.errors.title}
                                                </div>
                                            )}
                                        </div>

                                        <div className="mb-3">
                                            <label className="block text-sm font-bold mb-2">
                                                Image<span className="text-red-500 pl-2 font-normal text-base">*</span>
                                            </label>

                                            {/* Show current image in edit mode */}
                                            {id && (
                                                <div className="mb-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                                                    <div className="flex items-center gap-2">
                                                        <FontAwesomeIcon icon={faEdit} className="text-blue-600" />
                                                        <span className="text-sm text-blue-800 dark:text-blue-200">
                                                            Current image is uploaded - Select new image to update (optional)
                                                        </span>
                                                    </div>
                                                </div>
                                            )}

                                            {/* Hidden file input */}
                                            <input
                                                type="file"
                                                id="image"
                                                name="image"
                                                onChange={handleFileChange}
                                                onBlur={formik.handleBlur}
                                                accept="image/*"
                                                disabled={isSubmitting}
                                                className="hidden"
                                                ref={fileInputRef}
                                            />

                                            {/* Drag & Drop Area */}
                                            <div
                                                onClick={() => !isSubmitting && fileInputRef.current?.click()}
                                                onDragOver={(e) => {
                                                    e.preventDefault();
                                                    setIsDragging(true);
                                                }}
                                                onDragLeave={(e) => {
                                                    e.preventDefault();
                                                    setIsDragging(false);
                                                }}
                                                onDrop={(e) => {
                                                    e.preventDefault();
                                                    setIsDragging(false);
                                                    const files = e.dataTransfer.files;
                                                    if (files.length > 0) {
                                                        const event = { target: { files } };
                                                        handleFileChange(event);
                                                    }
                                                }}
                                                className={`
            border-2 border-dashed rounded-lg p-8 text-center cursor-pointer
            transition-all duration-300 ease-in-out
            ${isDragging
                                                        ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                                                        : 'border-purple-300 hover:border-purple-400 hover:bg-gray-50 dark:hover:bg-gray-800'
                                                    }
            ${formik.touched.image && formik.errors.image ? 'border-red-500 bg-red-50 dark:bg-red-900/20' : ''}
            ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}
        `}
                                            >
                                                <div className="flex flex-col items-center justify-center space-y-3">
                                                    <div className={`
                w-12 h-12 rounded-full flex items-center justify-center
                ${isDragging ? 'bg-purple-100 dark:bg-purple-800' : 'bg-gray-100 dark:bg-gray-700'}
            `}>
                                                        <FontAwesomeIcon
                                                            icon={faArrowUpFromBracket}
                                                            className={`text-xl ${isDragging ? 'text-purple-600' : 'text-gray-400'}`}
                                                        />
                                                    </div>

                                                    <div className="space-y-1">
                                                        {isDragging ? (
                                                            <p className="text-purple-600 font-medium dark:text-purple-400">
                                                                Drop image file here
                                                            </p>
                                                        ) : (
                                                            <>
                                                                <p className="text-gray-600 dark:text-gray-300">
                                                                    {id ? 'Drag & drop image file to update or' : 'Drag & drop image file or'}
                                                                </p>
                                                                <p className="text-purple-600 font-medium dark:text-purple-400">
                                                                    Browse files
                                                                </p>
                                                            </>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Show selected file name */}
                                            {formik.values.image && (
                                                <div className="mt-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                                                    <div className="flex items-center gap-2">
                                                        <FontAwesomeIcon icon={faEdit} className="text-green-600" />
                                                        <span className="text-sm text-green-800 dark:text-green-200">
                                                            Selected file: <strong>{formik.values.image.name}</strong>
                                                        </span>
                                                    </div>
                                                </div>
                                            )}

                                            {formik.touched.image && formik.errors.image && (
                                                <div className="text-red-500 text-sm mt-1">
                                                    {formik.errors.image}
                                                </div>
                                            )}
                                        </div>

                                        <div className="mb-3">
                                            <label className="block text-sm font-bold mb-2">
                                                Link<span className="text-red-500 pl-2 font-normal text-base">*</span>
                                            </label>
                                            <input
                                                type="text"
                                                id="link"
                                                name="link"
                                                onChange={formik.handleChange}
                                                onBlur={formik.handleBlur}
                                                value={formik.values.link}
                                                disabled={isSubmitting}
                                                className={`w-full dark:bg-gray-700 dark:border-gray-600 dark:text-white transition-all duration-200 px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${formik.touched.link && !!formik.errors.link
                                                    ? 'border-red-500'
                                                    : 'border-gray-300'
                                                    } ${isSubmitting ? 'bg-gray-100' : ''}`}
                                            />
                                            {formik.touched.link && formik.errors.link && (
                                                <div className="text-red-500 text-sm mt-1">
                                                    {formik.errors.link}
                                                </div>
                                            )}
                                        </div>
                                    </>
                                )}

                                <div className="flex gap-3 mt-4">
                                    <button
                                        type="button"
                                        onClick={toggleModal}
                                        disabled={isSubmitting}
                                        className={`flex-1 py-2 px-4 rounded-lg text-black transition-colors ${isSubmitting
                                            ? 'opacity-50 cursor-not-allowed'
                                            : 'hover:bg-gray-200'
                                            }`}
                                        style={{ background: "#F6F7FB" }}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className={`flex-1 py-2 px-4 border-0 rounded-lg text-white font-medium transition-colors ${isSubmitting
                                            ? 'opacity-50 cursor-not-allowed'
                                            : 'hover:opacity-90'
                                            }`}
                                        style={{ backgroundColor: "#0777AB", color: "#fff" }}
                                        disabled={isSubmitting}
                                        onClick={(e) => {
                                            console.log('Submit button clicked');
                                            console.log('Form values before submit:', formik.values);
                                            console.log('Form errors:', formik.errors);
                                            console.log('Form touched:', formik.touched);
                                        }}
                                    >
                                        {isSubmitting ? (
                                            <div className="flex items-center justify-center">
                                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
                                                Loading...
                                            </div>
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

export default Portfolio;