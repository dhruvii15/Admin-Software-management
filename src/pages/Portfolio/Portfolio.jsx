import React, { useEffect, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEdit, faPlus, faTrash } from '@fortawesome/free-solid-svg-icons';
import axios from 'axios';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { toast, ToastContainer } from 'react-toastify';
import { Table, TableBody, TableCell, TableHeader, TableRow } from "../../components/ui/table";
import 'react-toastify/dist/ReactToastify.css';
import { faApple } from '@fortawesome/free-brands-svg-icons';

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
        axios.post('https://api.pslink.world/api/plexus/portfolio/read/admin', { page })
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

    const portfolioSchema = Yup.object().shape({
        portfolioDescription: Yup.string()
            .required('Description is required')
            .min(10, 'Description must be at least 10 characters'),
        portfolioCountry: Yup.number()
            .typeError('Country must be a number')
            .required('Country is required')
            .positive('Country must be a positive number'),
        portfolioplaystoreLink: Yup.string()
            .url('Must be a valid URL')
            .required('Playstore link is required'),
        portfolioappstoreLink: Yup.string()
            .url('Must be a valid URL')
            .required('Appstore link is required'),
        portfolioRank: Yup.number()
            .required('Rank is required')
            .integer('Rank must be an integer')
            .min(1, 'Rank must be at least 1'),
    });

    const formik = useFormik({
        initialValues: {
            portfolioDescription: '',
            portfolioCountry: '',
            portfolioplaystoreLink: '',
            portfolioappstoreLink: '',
            portfolioRank: '',
        },
        validationSchema: portfolioSchema,
        onSubmit: async (values, { setSubmitting, resetForm }) => {
            try {
                setIsSubmitting(true);
                const formData = new FormData();
                formData.append('description', values.portfolioDescription);
                formData.append('country', values.portfolioCountry);
                formData.append('playstoreLink', values.portfolioplaystoreLink);
                formData.append('appstoreLink', values.portfolioappstoreLink);
                formData.append('rank', values.portfolioRank);

                const request = id !== undefined
                    ? axios.patch(`https://api.pslink.world/api/plexus/portfolio/update/${id}`, formData)
                    : axios.post('https://api.pslink.world/api/plexus/portfolio/create', formData);

                const res = await request;
                resetForm();
                setId(undefined);
                getData(currentPage);
                toast.success(res.data.message);
                toggleModal();
            } catch (err) {
                console.error(err);
                toast.error("An error occurred. Please try again.");
            } finally {
                setSubmitting(false);
                setIsSubmitting(false);
            }
        },
    });

    const handleEdit = (portfolio) => {
        if (!isSubmitting) {
            formik.setValues({
                portfolioDescription: portfolio.description,
                portfolioCountry: portfolio.country,
                portfolioplaystoreLink: portfolio.playstoreLink,
                portfolioappstoreLink: portfolio.appstoreLink,
                portfolioRank: portfolio.rank.toString(),
            });
            setId(portfolio._id);
            toggleModal();
        }
    };

    const handleDelete = async (portfolioId) => {
        if (!isSubmitting && window.confirm("Are you sure you want to delete this portfolio?")) {
            try {
                setIsSubmitting(true);
                const res = await axios.delete(`https://api.pslink.world/api/plexus/portfolio/delete/${portfolioId}`);
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
                                    <TableCell isHeader className="py-4 font-medium text-gray-500 dark:text-gray-300 px-2 border-r border-gray-200 dark:border-gray-700">Title</TableCell>
                                    <TableCell isHeader className="py-4 font-medium text-gray-500 dark:text-gray-300 px-2 border-r border-gray-200 dark:border-gray-700">Description</TableCell>
                                    <TableCell isHeader className="py-4 font-medium text-gray-500 dark:text-gray-300 px-2 border-r border-gray-200 dark:border-gray-700">Country</TableCell>
                                    <TableCell isHeader className="py-4 font-medium text-gray-500 dark:text-gray-300 px-2 border-r border-gray-200 dark:border-gray-700">PlayStore</TableCell>
                                    <TableCell isHeader className="py-4 font-medium text-gray-500 dark:text-gray-300 px-2 border-r border-gray-200 dark:border-gray-700">AppStore</TableCell>
                                    <TableCell isHeader className="py-4 font-medium text-gray-500 dark:text-gray-300 px-2 border-r border-gray-200 dark:border-gray-700">Rank</TableCell>
                                    <TableCell isHeader className="py-4 font-medium text-gray-500 dark:text-gray-300 px-2">Actions</TableCell>
                                </TableRow>
                            </TableHeader>

                            <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05] text-center">
                                {data.sort((a, b) => a.rank - b.rank).map((portfolio, index) => (
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
                                            {portfolio.title}
                                        </TableCell>
                                        <TableCell className="py-3 px-2 border-r border-gray-200 dark:border-gray-700 dark:text-gray-200">
                                            {portfolio.description}
                                        </TableCell>
                                        <TableCell className="py-3 px-2 border-r border-gray-200 dark:border-gray-700 dark:text-gray-200">
                                            {portfolio.country}
                                        </TableCell>
                                        <TableCell className="py-3 px-2 border-r border-gray-200 dark:border-gray-700">
                                            <a href={portfolio.playstoreLink} target="_blank" rel="noopener noreferrer" className="text-[#0777AB] hover:scale-110 transition-transform">
                                                <img src={play} alt="playstore" className="w-5 h-5 inline-block" />
                                            </a>
                                        </TableCell>
                                        <TableCell className="py-3 px-2 border-r border-gray-200 dark:border-gray-700">
                                            <a href={portfolio.appstoreLink} target="_blank" rel="noopener noreferrer" className="text-black hover:scale-110 transition-transform">
                                                <FontAwesomeIcon icon={faApple} className="text-xl dark:text-white" />
                                            </a>
                                        </TableCell>
                                        <TableCell className="py-3 px-2 border-r border-gray-200 dark:border-gray-700 dark:text-gray-200">
                                            {portfolio.rank}
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
                    <div className="bg-white rounded-lg w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto dark:bg-gray-800 dark:text-gray-200">
                        <div className="flex justify-between items-center p-4 border-b">
                            <h5 className="text-lg font-semibold">{id ? "Edit Portfolio" : "Add New Portfolio"}</h5>
                        </div>
                        <div className="p-4">
                            <form onSubmit={formik.handleSubmit}>
                                <div className="mb-3">
                                    <label className="block text-sm font-bold mb-2">
                                        Description<span className="text-red-500 pl-2 font-normal text-base">*</span>
                                    </label>
                                    <textarea
                                        rows={4}
                                        id="portfolioDescription"
                                        name="portfolioDescription"
                                        onChange={formik.handleChange}
                                        onBlur={formik.handleBlur}
                                        value={formik.values.portfolioDescription}
                                        disabled={isSubmitting}
                                        className={`w-full dark:bg-gray-700 dark:border-gray-600 dark:text-white transition-all duration-200 px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${formik.touched.portfolioDescription && !!formik.errors.portfolioDescription
                                            ? 'border-red-500'
                                            : 'border-gray-300'
                                            } ${isSubmitting ? 'bg-gray-100' : ''}`}
                                    />
                                    {formik.touched.portfolioDescription && formik.errors.portfolioDescription && (
                                        <div className="text-red-500 text-sm mt-1">
                                            {formik.errors.portfolioDescription}
                                        </div>
                                    )}
                                </div>

                                <div className="mb-3">
                                    <label className="block text-sm font-bold mb-2">
                                        Country Number<span className="text-red-500 pl-2 font-normal text-base">*</span>
                                    </label>
                                    <input
                                        type="number"
                                        id="portfolioCountry"
                                        name="portfolioCountry"
                                        onChange={formik.handleChange}
                                        onBlur={formik.handleBlur}
                                        value={formik.values.portfolioCountry}
                                        disabled={isSubmitting}
                                        className={`w-full dark:bg-gray-700 dark:border-gray-600 dark:text-white transition-all duration-200 px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${formik.touched.portfolioCountry && !!formik.errors.portfolioCountry
                                            ? 'border-red-500'
                                            : 'border-gray-300'
                                            } ${isSubmitting ? 'bg-gray-100' : ''}`}
                                    />
                                    {formik.touched.portfolioCountry && formik.errors.portfolioCountry && (
                                        <div className="text-red-500 text-sm mt-1">
                                            {formik.errors.portfolioCountry}
                                        </div>
                                    )}
                                </div>

                                <div className="mb-3">
                                    <label className="block text-sm font-bold mb-2">
                                        Playstore Link<span className="text-red-500 pl-2 font-normal text-base">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        id="portfolioplaystoreLink"
                                        name="portfolioplaystoreLink"
                                        onChange={formik.handleChange}
                                        onBlur={formik.handleBlur}
                                        value={formik.values.portfolioplaystoreLink}
                                        disabled={isSubmitting}
                                        className={`w-full dark:bg-gray-700 dark:border-gray-600 dark:text-white transition-all duration-200 px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${formik.touched.portfolioplaystoreLink && !!formik.errors.portfolioplaystoreLink
                                            ? 'border-red-500'
                                            : 'border-gray-300'
                                            } ${isSubmitting ? 'bg-gray-100' : ''}`}
                                    />
                                    {formik.touched.portfolioplaystoreLink && formik.errors.portfolioplaystoreLink && (
                                        <div className="text-red-500 text-sm mt-1">
                                            {formik.errors.portfolioplaystoreLink}
                                        </div>
                                    )}
                                </div>

                                <div className="mb-3">
                                    <label className="block text-sm font-bold mb-2">
                                        Appstore Link<span className="text-red-500 pl-2 font-normal text-base">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        id="portfolioappstoreLink"
                                        name="portfolioappstoreLink"
                                        onChange={formik.handleChange}
                                        onBlur={formik.handleBlur}
                                        value={formik.values.portfolioappstoreLink}
                                        disabled={isSubmitting}
                                        className={`w-full dark:bg-gray-700 dark:border-gray-600 dark:text-white transition-all duration-200 px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${formik.touched.portfolioappstoreLink && !!formik.errors.portfolioappstoreLink
                                            ? 'border-red-500'
                                            : 'border-gray-300'
                                            } ${isSubmitting ? 'bg-gray-100' : ''}`}
                                    />
                                    {formik.touched.portfolioappstoreLink && formik.errors.portfolioappstoreLink && (
                                        <div className="text-red-500 text-sm mt-1">
                                            {formik.errors.portfolioappstoreLink}
                                        </div>
                                    )}
                                </div>

                                <div className="mb-3">
                                    <label className="block text-sm font-bold mb-2">
                                        Rank<span className="text-red-500 pl-2 font-normal text-base">*</span>
                                    </label>
                                    <input
                                        type="number"
                                        id="portfolioRank"
                                        name="portfolioRank"
                                        onChange={formik.handleChange}
                                        onBlur={formik.handleBlur}
                                        value={formik.values.portfolioRank}
                                        disabled={isSubmitting}
                                        className={`w-full dark:bg-gray-700 dark:border-gray-600 dark:text-white transition-all duration-200 px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${formik.touched.portfolioRank && !!formik.errors.portfolioRank
                                            ? 'border-red-500'
                                            : 'border-gray-300'
                                            } ${isSubmitting ? 'bg-gray-100' : ''}`}
                                    />
                                    {formik.touched.portfolioRank && formik.errors.portfolioRank && (
                                        <div className="text-red-500 text-sm mt-1">
                                            {formik.errors.portfolioRank}
                                        </div>
                                    )}
                                </div>

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