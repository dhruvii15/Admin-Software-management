import React, { useEffect, useState } from 'react';
import { toast, ToastContainer } from 'react-toastify';
import axios from 'axios';
import { faEdit, faTrash, faPlus, faMagnifyingGlass, faTimes } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import 'react-toastify/dist/ReactToastify.css';
import { Table, TableBody, TableCell, TableHeader, TableRow } from "../../components/ui/table";
import CustomPagination from '../../components/common/pagination';
import PageBreadcrumb from '../../components/common/PageBreadCrumb';

const OpenPosition = () => {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errors, setErrors] = useState({});
    const [searchTerm, setSearchTerm] = useState('');

    // Pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const [totalItems, setTotalItems] = useState(0);
    const [totalPages, setTotalPages] = useState(1);

    const itemsPerPage = 15;

    const emptyFormData = {
        department: '',
        jobType: '',
        position: '',
        duties: [''],
        needs: [''],
        benefits: [''],
        experience: '',
        status: false
    };
    const [formData, setFormData] = useState(emptyFormData);

    const getData = (page) => {
        setLoading(true);
        axios.post('http://localhost:5004/api/plexus/position/read/admin', { page })
            .then((res) => {
                setData(res.data.data);
                setTotalItems(res.data.totalItems);
                setTotalPages(Math.ceil(res.data.totalItems / itemsPerPage));
                setLoading(false);
            })
            .catch((err) => {
                console.error(err);
                setLoading(false);
                // toast.error("Failed to fetch data.");
            });
    };

    useEffect(() => {
        getData(currentPage);
    }, [currentPage]);

    // Handle page change
    const handlePageChange = (pageNumber) => {
        setCurrentPage(pageNumber);
    };

    const validate = () => {
        const newErrors = {};
        if (!formData.department.trim()) newErrors.department = 'Department is required';
        if (!formData.jobType.trim()) newErrors.jobType = 'Job Type is required';
        if (!formData.position.trim()) newErrors.position = 'Position Name is required';
        if (!formData.experience.trim()) newErrors.experience = 'Experience is required';

        // Validate arrays
        if (!formData.duties.some(duty => duty.trim())) {
            newErrors.duties = 'At least one responsibility is required';
        }
        if (!formData.needs.some(need => need.trim())) {
            newErrors.needs = 'At least one requirement is required';
        }
        if (!formData.benefits.some(benefit => benefit.trim())) {
            newErrors.benefits = 'At least one benefit is required';
        }

        // Remove empty entries from arrays
        setFormData(prev => ({
            ...prev,
            duties: prev.duties.filter(duty => duty.trim()),
            needs: prev.needs.filter(need => need.trim()),
            benefits: prev.benefits.filter(benefit => benefit.trim())
        }));

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const toggleModal = (mode) => {
        if (!isSubmitting) {
            if (mode === 'add') {
                setIsEditing(false);
                setFormData(emptyFormData);
            }
            setErrors({});
            setShowModal(!showModal);
        }
    };

    const handleEdit = (row) => {
        if (!isSubmitting) {
            setIsEditing(true);
            setFormData({
                _id: row._id,
                department: row.department,
                jobType: row.jobType,
                position: row.position,
                duties: Array.isArray(row.duties) ? row.duties : [row.duties],
                needs: Array.isArray(row.needs) ? row.needs : [row.needs],
                benefits: Array.isArray(row.benefits) ? row.benefits : [row.benefits],
                experience: row.experience,
                status: row.status
            });
            setErrors({});
            toggleModal('edit');
        }
    };

    const handleArrayFieldChange = (fieldName, index, value) => {
        setFormData(prev => {
            const newArray = [...prev[fieldName]];
            newArray[index] = value;
            return { ...prev, [fieldName]: newArray };
        });
        // Clear error when user starts typing
        if (errors[fieldName]) {
            setErrors(prev => ({ ...prev, [fieldName]: undefined }));
        }
    };

    const handleInputChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        // Clear error when user starts typing
        if (errors[field]) {
            setErrors(prev => ({ ...prev, [field]: undefined }));
        }
    };

    const addArrayField = (fieldName) => {
        setFormData(prev => ({
            ...prev,
            [fieldName]: [...prev[fieldName], '']
        }));
    };

    const removeArrayField = (fieldName, index) => {
        if (formData[fieldName].length > 1) {
            setFormData(prev => ({
                ...prev,
                [fieldName]: prev[fieldName].filter((_, i) => i !== index)
            }));
        } else {
            toast.warning(`At least one ${fieldName} is required`);
        }
    };

    const handleSubmit = async () => {
        if (!validate()) return;

        try {
            setIsSubmitting(true);
            if (isEditing) {
                await axios.patch(`http://localhost:5004/api/plexus/position/update/${formData._id}`, formData);
                toast.success("Position updated successfully");
            } else {
                await axios.post('http://localhost:5004/api/plexus/position/create', formData);
                toast.success("Position created successfully");
            }
            getData(currentPage);
            toggleModal();
        } catch (err) {
            console.error(err);
            toast.error(isEditing ? "Failed to update position." : "Failed to create position.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (id) => {
        if (!isSubmitting && window.confirm("Are you sure you want to delete this position?")) {
            try {
                setIsSubmitting(true);
                const res = await axios.delete(`http://localhost:5004/api/plexus/position/delete/${id}`);
                toast.success(res.data.message);
                getData(currentPage);
            } catch (err) {
                console.error(err);
                toast.error("Failed to delete data.");
            } finally {
                setIsSubmitting(false);
            }
        }
    };

    const handleStatusToggle = async (id, currentStatus) => {
        try {
            setIsSubmitting(true);
            await axios.patch(`http://localhost:5004/api/plexus/position/update/${id}`, { status: !currentStatus });
            toast.success("Status updated successfully");
            getData(currentPage);
        } catch (err) {
            console.error(err);
            toast.error("Failed to update status.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleSearch = (e) => {
        setSearchTerm(e.target.value);
        // Reset to first page when searching
        setCurrentPage(currentPage);
    };

    const getFilteredData = () => {
        let filtered = [...data];

        // Filter by search term for both department and name
        if (searchTerm.trim()) {
            const searchLower = searchTerm.toLowerCase();
            filtered = filtered.filter(item =>
                (item.department?.toLowerCase() || "").includes(searchLower) ||
                (item.position?.toLowerCase() || "").includes(searchLower) ||
                (item.jobType?.toLowerCase() || "").includes(searchLower)
            );
        }

        return filtered;
    };

    const filteredData = getFilteredData();

    // Generate pagination items
    const paginationItems = [];
    const maxPageButtons = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxPageButtons / 2));
    let endPage = Math.min(totalPages, startPage + maxPageButtons - 1);

    // Adjust start page if end page is at maximum
    if (endPage === totalPages) {
        startPage = Math.max(1, endPage - maxPageButtons + 1);
    }

    for (let number = startPage; number <= endPage; number++) {
        paginationItems.push(number);
    }

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

            <PageBreadcrumb pageTitle="Open-Position" />

            <div className="bg-white rounded-2xl px-4 py-7 dark:border-gray-800 dark:bg-white/[0.03]">
                <div className="flex items-center justify-between flex-wrap">
                    {/* Search Input */}
                    <div className="relative my-2 ">
                        <input
                            type="text"
                            placeholder="Search by department or position name"
                            className="w-full  pl-4 pr-10 py-2 border dark:bg-gray-700 dark:border-gray-600 dark:text-white transition-all duration-200 border-gray-300 rounded-lg focus:outline-none  focus:border-transparent"
                            value={searchTerm}
                            onChange={handleSearch}
                        />
                        <button
                            className="absolute right-3 top-1/2 transform -translate-y-1/2 bg-transparent border-none cursor-pointer"
                            onClick={() => setSearchTerm("")}
                        >
                            <FontAwesomeIcon
                                icon={searchTerm ? faTimes : faMagnifyingGlass}
                                className="text-gray-400"
                            />
                        </button>
                    </div>

                    {/* Create Position Button */}
                    <button
                        className="px-4 py-2 bg-[#0777AB] text-white rounded-lg transition-colors duration-200 flex items-center"
                        onClick={() => toggleModal('add')}
                    >
                        <FontAwesomeIcon icon={faPlus} className="mr-2" />
                        Create Position
                    </button>
                </div>


                <div className="transform transition-all duration-500 ease-in-out overflow-x-auto pt-3">
                    <div className="space-y-6 rounded-lg xl:border dark:border-gray-800">
                        <Table>
                            <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
                                <TableRow>
                                    <TableCell isHeader className="py-4 font-medium text-gray-500 dark:text-gray-300 px-2 border-r border-gray-200 dark:border-gray-700">ID</TableCell>
                                    <TableCell isHeader className="py-4 font-medium text-gray-500 dark:text-gray-300 px-2 border-r border-gray-200 dark:border-gray-700">Department</TableCell>
                                    <TableCell isHeader className="py-4 font-medium text-gray-500 dark:text-gray-300 px-2 border-r border-gray-200 dark:border-gray-700">Job Type</TableCell>
                                    <TableCell isHeader className="py-4 font-medium text-gray-500 dark:text-gray-300 px-2 border-r border-gray-200 dark:border-gray-700">Position</TableCell>
                                    <TableCell isHeader className="py-4 font-medium text-gray-500 dark:text-gray-300 px-2 border-r border-gray-200 dark:border-gray-700">Responsibilities</TableCell>
                                    <TableCell isHeader className="py-4 font-medium text-gray-500 dark:text-gray-300 px-2 border-r border-gray-200 dark:border-gray-700">Requirements</TableCell>
                                    <TableCell isHeader className="py-4 font-medium text-gray-500 dark:text-gray-300 px-2 border-r border-gray-200 dark:border-gray-700">Benefits</TableCell>
                                    <TableCell isHeader className="py-4 font-medium text-gray-500 dark:text-gray-300 px-2 border-r border-gray-200 dark:border-gray-700">Experience</TableCell>
                                    <TableCell isHeader className="py-4 font-medium text-gray-500 dark:text-gray-300 px-2 border-r border-gray-200 dark:border-gray-700">Status</TableCell>
                                    <TableCell isHeader className="py-4 font-medium text-gray-500 dark:text-gray-300 px-2">Actions</TableCell>
                                </TableRow>
                            </TableHeader>

                            <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05] text-center">
                                {filteredData.length > 0 ? (
                                    filteredData.map((row, index) => (
                                        <TableRow
                                            key={row._id}
                                            className="transform transition-all duration-300 hover:bg-gray-50 dark:hover:bg-gray-800/50"
                                            style={{
                                                animationDelay: `${index * 50}ms`,
                                                animation: 'fadeInLeft 0.4s ease-out forwards'
                                            }}
                                        >
                                            <TableCell className="px-2 py-3 border-r border-gray-200 dark:border-gray-700 dark:text-gray-200">
                                                {(currentPage - 1) * itemsPerPage + index + 1}
                                            </TableCell>
                                            <TableCell className="px-2 py-3 border-r border-gray-200 dark:border-gray-700 dark:text-gray-200">
                                                {row.department}
                                            </TableCell>
                                            <TableCell className="px-2 py-3 border-r border-gray-200 dark:border-gray-700 dark:text-gray-200">
                                                {row.jobType}
                                            </TableCell>
                                            <TableCell className="px-2 py-3 border-r border-gray-200 dark:border-gray-700 dark:text-gray-200">
                                                {row.position}
                                            </TableCell>
                                            <TableCell className="px-2 py-3 border-r border-gray-200 dark:border-gray-700 dark:text-gray-200">
                                                {Array.isArray(row.duties) ? row.duties.join(', ') : row.duties}
                                            </TableCell>
                                            <TableCell className="px-2 py-3 border-r border-gray-200 dark:border-gray-700 dark:text-gray-200">
                                                {Array.isArray(row.needs) ? row.needs.join(', ') : row.needs}
                                            </TableCell>
                                            <TableCell className="px-2 py-3 border-r border-gray-200 dark:border-gray-700 dark:text-gray-200">
                                                {Array.isArray(row.benefits) ? row.benefits.join(', ') : row.benefits}
                                            </TableCell>
                                            <TableCell className="px-2 py-3 border-r border-gray-200 dark:border-gray-700 dark:text-gray-200">
                                                {row.experience}
                                            </TableCell>
                                            <TableCell className="px-2 py-3 border-r border-gray-200 dark:border-gray-700">
                                                <label className="relative inline-flex items-center cursor-pointer">
                                                    <input
                                                        type="checkbox"
                                                        checked={row.status}
                                                        onChange={() => handleStatusToggle(row._id, row.status)}
                                                        className="sr-only peer"
                                                    />
                                                    <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#0777AB]"></div>
                                                </label>
                                            </TableCell>
                                            <TableCell className="px-2 py-3 dark:text-gray-200">
                                                <div className="flex justify-center gap-3">
                                                    <button
                                                        className="text-[#0777AB] hover:scale-110 transition-transform"
                                                        onClick={() => handleEdit(row)}
                                                        disabled={isSubmitting}
                                                    >
                                                        <FontAwesomeIcon icon={faEdit} />
                                                    </button>
                                                    <button
                                                        className="text-red-600 hover:scale-110 transition-transform"
                                                        onClick={() => handleDelete(row._id)}
                                                        disabled={isSubmitting}
                                                    >
                                                        <FontAwesomeIcon icon={faTrash} />
                                                    </button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={10} className="text-center pt-5 pb-4 dark:text-gray-200">
                                            No positions found
                                        </td>
                                    </tr>
                                )}
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
            {showModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-99999">
                    <div className="bg-white rounded-lg w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto dark:bg-gray-800 dark:text-gray-200">
                        <div className="flex justify-between items-center p-4 border-b">
                            <h5 className="text-lg font-semibold">{isEditing ? "Edit Position" : "Add New Position"}</h5>
                        </div>
                        <div className='p-4'>
                            <form>
                                <div className="mb-4">
                                    <label className="block text-sm font-semibold mb-2">
                                        Department <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.department}
                                        onChange={(e) => handleInputChange('department', e.target.value)}
                                        className={`w-full dark:bg-gray-700 dark:border-gray-600 dark:text-white transition-all duration-200 px-3 py-2 border rounded-lg focus:outline-none  ${errors.department ? 'border-red-500' : 'border-gray-300'
                                            }`}
                                        disabled={isSubmitting}
                                    />
                                    {errors.department && (
                                        <p className="text-red-500 text-sm mt-1">{errors.department}</p>
                                    )}
                                </div>

                                <div className="mb-4">
                                    <label className="block text-sm font-semibold mb-2">
                                        Job Type <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.jobType}
                                        onChange={(e) => handleInputChange('jobType', e.target.value)}
                                        className={`w-full dark:bg-gray-700 dark:border-gray-600 dark:text-white transition-all duration-200 px-3 py-2 border rounded-lg focus:outline-none ${errors.jobType ? 'border-red-500' : 'border-gray-300'
                                            }`}
                                        disabled={isSubmitting}
                                    />
                                    {errors.jobType && (
                                        <p className="text-red-500 text-sm mt-1">{errors.jobType}</p>
                                    )}
                                </div>

                                <div className="mb-4">
                                    <label className="block text-sm font-semibold mb-2">
                                        Position Name <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.position}
                                        onChange={(e) => handleInputChange('position', e.target.value)}
                                        className={`w-full dark:bg-gray-700 dark:border-gray-600 dark:text-white transition-all duration-200 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${errors.position ? 'border-red-500' : 'border-gray-300'
                                            }`}
                                        disabled={isSubmitting}
                                    />
                                    {errors.position && (
                                        <p className="text-red-500 text-sm mt-1">{errors.position}</p>
                                    )}
                                </div>

                                {/* Duties Array Field */}
                                <div className="mb-4">
                                    <label className="block text-sm font-semibold mb-2">
                                        Responsibilities <span className="text-red-500">*</span>
                                    </label>
                                    {formData.duties.map((duty, index) => (
                                        <div key={index} className="flex mb-2">
                                            <input
                                                type="text"
                                                value={duty}
                                                onChange={(e) => handleArrayFieldChange('duties', index, e.target.value)}
                                                placeholder={`Duty ${index + 1}`}
                                                className={`dark:bg-gray-700 dark:border-gray-600 dark:text-white transition-all duration-200 flex-1 px-3 py-2 border rounded-l-lg focus:outline-none ${errors.duties ? 'border-red-500' : 'border-gray-300'
                                                    }`}
                                                disabled={isSubmitting}
                                            />
                                            <button
                                                type="button"
                                                className="px-3 py-2 bg-[#0777ab] text-white rounded-r-lg"
                                                onClick={() => removeArrayField('duties', index)}
                                                disabled={isSubmitting}
                                            >
                                                <FontAwesomeIcon icon={faTrash} />
                                            </button>
                                        </div>
                                    ))}
                                    <button
                                        type="button"
                                        className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                                        onClick={() => addArrayField('duties')}
                                        disabled={isSubmitting}
                                    >
                                        + Add Responsibilities
                                    </button>
                                    {errors.duties && (
                                        <p className="text-red-500 text-sm mt-1">{errors.duties}</p>
                                    )}
                                </div>

                                {/* Needs Array Field */}
                                <div className="mb-4">
                                    <label className="block text-sm font-semibold mb-2">
                                        Requirements <span className="text-red-500">*</span>
                                    </label>
                                    {formData.needs.map((need, index) => (
                                        <div key={index} className="flex mb-2">
                                            <input
                                                type="text"
                                                value={need}
                                                onChange={(e) => handleArrayFieldChange('needs', index, e.target.value)}
                                                placeholder={`Need ${index + 1}`}
                                                className="dark:bg-gray-700 dark:border-gray-600 dark:text-white transition-all duration-200 flex-1 px-3 py-2 border border-gray-300 rounded-l-lg focus:outline-none"
                                            />
                                            <button
                                                type="button"
                                                className="px-3 py-2 bg-[#0777ab] text-white rounded-r-lg"
                                                onClick={() => removeArrayField('needs', index)}
                                            >
                                                <FontAwesomeIcon icon={faTrash} />
                                            </button>
                                        </div>
                                    ))}
                                    <button
                                        type="button"
                                        className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                                        onClick={() => addArrayField('needs')}
                                    >
                                        + Add Requirements
                                    </button>
                                    {errors.needs && (
                                        <p className="text-red-500 text-sm mt-1">{errors.needs}</p>
                                    )}
                                </div>

                                {/* Benefits Array Field */}
                                <div className="mb-4">
                                    <label className="block text-sm font-semibold mb-2">
                                        Benefits <span className="text-red-500">*</span>
                                    </label>
                                    {formData.benefits.map((benefit, index) => (
                                        <div key={index} className="flex mb-2">
                                            <input
                                                type="text"
                                                value={benefit}
                                                onChange={(e) => handleArrayFieldChange('benefits', index, e.target.value)}
                                                placeholder={`Benefit ${index + 1}`}
                                                className="dark:bg-gray-700 dark:border-gray-600 dark:text-white transition-all duration-200 flex-1 px-3 py-2 border border-gray-300 rounded-l-lg focus:outline-none"
                                            />
                                            <button
                                                type="button"
                                                className="px-3 py-2 bg-[#0777ab] text-white rounded-r-lg"
                                                onClick={() => removeArrayField('benefits', index)}
                                            >
                                                <FontAwesomeIcon icon={faTrash} />
                                            </button>
                                        </div>
                                    ))}
                                    <button
                                        type="button"
                                        className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                                        onClick={() => addArrayField('benefits')}
                                    >
                                        + Add Benefit
                                    </button>
                                    {errors.benefits && (
                                        <p className="text-red-500 text-sm mt-1">{errors.benefits}</p>
                                    )}
                                </div>

                                <div className="mb-4">
                                    <label className="block text-sm font-semibold mb-2">
                                        Experience <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.experience}
                                        onChange={(e) => setFormData({ ...formData, experience: e.target.value })}
                                        className="w-full dark:bg-gray-700 dark:border-gray-600 dark:text-white transition-all duration-200 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none"
                                    />
                                    {errors.experience && (
                                        <p className="text-red-500 text-sm mt-1">{errors.experience}</p>
                                    )}
                                </div>

                                <div className="mb-6">
                                    <label className="block text-sm font-semibold mb-2">Status</label>
                                    <label className="flex items-center">
                                        <input
                                            type="checkbox"
                                            checked={formData.status}
                                            onChange={(e) => setFormData({ ...formData, status: e.target.checked })}
                                            className="mr-2"
                                        />
                                        <span>{formData.status ? "Active" : "Inactive"}</span>
                                    </label>
                                </div>

                                <div className="flex space-x-4">
                                    <button
                                        type="button"
                                        onClick={() => toggleModal()}
                                        disabled={isSubmitting}
                                        className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="button"
                                        onClick={handleSubmit}
                                        disabled={isSubmitting}
                                        className="flex-1 px-4 py-2 bg-[#0777AB] text-white rounded-lg disabled:bg-blue-400"
                                    >
                                        {isSubmitting ? (
                                            <div className="flex items-center justify-center">
                                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                                {isEditing ? 'Updating...' : 'Creating...'}
                                            </div>
                                        ) : (
                                            isEditing ? 'Update Position' : 'Create Position'
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

export default OpenPosition;