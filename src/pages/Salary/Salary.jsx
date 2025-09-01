import React, { useEffect, useRef, useState } from "react";
import axios from "axios";
import { Table, TableBody, TableCell, TableHeader, TableRow } from "../../components/ui/table";
import { Button } from "react-bootstrap";
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEdit, faPlus, faTrash, faArrowUpFromBracket, faFileArrowUp, faEye, faFileInvoice, faChevronDown, faSave, faTimes, faCheck } from "@fortawesome/free-solid-svg-icons";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";

const Salary = () => {
    const [visible, setVisible] = useState(false);
    const [id, setId] = useState();
    const [loading, setLoading] = useState(true);
    const [errors, setErrors] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [filteredData, setFilteredData] = useState([]);
    const [originalData, setOriginalData] = useState([]);
    const [isDragging, setIsDragging] = useState(false);
    const [selectedFileName, setSelectedFileName] = useState("");
    const [currentFileName, setCurrentFileName] = useState("");
    const [isOpen, setIsOpen] = useState(false);
    const [salaryData, setSalaryData] = useState([]);
    const fileInputRef = useRef(null);
    const [selectedYear, setSelectedYear] = useState("");
    const [isYearFilterOpen, setIsYearFilterOpen] = useState(false);
    const yearFilterRef = useRef(null);

    // New state for employee editing
    const [editingEmployee, setEditingEmployee] = useState(null);
    const [employeeRemark, setEmployeeRemark] = useState("");
    const [isUpdatingEmployee, setIsUpdatingEmployee] = useState(false);

    // Add this useEffect to handle clicking outside the year filter dropdown
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (yearFilterRef.current && !yearFilterRef.current.contains(event.target)) {
                setIsYearFilterOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    // Function to handle year selection - FIXED
    const handleYearSelection = (year) => {
        setSelectedYear(year);
        setIsYearFilterOpen(false);

        // Filter the data based on selected year
        if (year === "" || year === "All Years") {
            // Show all data
            setFilteredData(originalData);
        } else {
            // Filter data by selected year
            const filtered = originalData.filter(salary => {
                if (year === "undefined") {
                    return !salary.year || salary.year === null || salary.year === undefined;
                }
                // Convert both to strings for comparison to handle number/string inconsistencies
                return String(salary.year) === String(year);
            });
            setFilteredData(filtered);
        }
    };

    // Generate year options (current year - 10 to current year + 1)
    const currentYear = new Date().getFullYear();
    const years = [];
    for (let i = 2024; i <= currentYear; i++) {
        years.push(i);
    }

    // Form state for salary data
    const [formData, setFormData] = useState({
        month: '',
        year: '',
        pdf: null
    });

    const toggleModal = (mode) => {
        if (!isSubmitting) {
            if (mode === 'add') {
                setFormData({
                    month: '',
                    year: '',
                    pdf: null
                });
                setId(undefined);
                setSelectedFileName("");
                setCurrentFileName("");
            }
            setErrors({});
            setVisible(!visible);
        }
    };

    // API calls - FIXED to store original data
    const getData = async () => {
        try {
            setLoading(true);
            // Replace with your salary API endpoint
            const response = await axios.get('http://localhost:5005/api/plexus/employee/salary/read');
            const data = response.data.data;
            setOriginalData(data);
            setFilteredData(data);
        } catch (err) {
            console.error(err);
            toast.error("Failed to fetch salary data.");
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

    // File handling functions
    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            validateAndSetFile(file);
        }
    };

    const validateAndSetFile = (file) => {
        // Only allow PDF files
        if (file.type !== 'application/pdf') {
            setErrors(prev => ({ ...prev, pdf: 'Only PDF files are allowed' }));
            return;
        }

        // Check file size (5MB limit)
        if (file.size > 5 * 1024 * 1024) {
            setErrors(prev => ({ ...prev, pdf: 'File size must be less than 5MB' }));
            return;
        }

        setFormData(prev => ({ ...prev, pdf: file }));
        setSelectedFileName(file.name);

        // Clear any existing file errors
        if (errors.pdf) {
            setErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors.pdf;
                return newErrors;
            });
        }
    };

    const onDragOver = (e) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const onDragLeave = (e) => {
        e.preventDefault();
        setIsDragging(false);
    };

    const onDrop = (e) => {
        e.preventDefault();
        setIsDragging(false);

        const files = e.dataTransfer.files;
        if (files.length > 0) {
            validateAndSetFile(files[0]);
        }
    };

    // UPDATED validation for edit mode
    const validate = () => {
        const newErrors = {};

        // All fields are required
        if (!formData.month.trim()) newErrors.month = 'Month is required';
        if (!formData.year.trim()) newErrors.year = 'Year is required';

        // For new entries, PDF is required. For updates, it's optional
        if (!id && !formData.pdf) {
            newErrors.pdf = 'Salary PDF file is required';
        }

        // Year validation (should be a valid 4-digit year)
        const currentYear = new Date().getFullYear();
        const yearNum = parseInt(formData.year);
        if (formData.year && (isNaN(yearNum) || yearNum < 2000 || yearNum > currentYear + 1)) {
            newErrors.year = 'Please enter a valid year (2000 - ' + (currentYear + 1) + ')';
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

            // Create FormData for file upload
            const formDataToSend = new FormData();
            formDataToSend.append('month', formData.month);
            formDataToSend.append('year', formData.year);

            // Only append PDF if a new file is selected
            if (formData.pdf) {
                formDataToSend.append('pdf', formData.pdf);
            }

            // Replace with your salary API endpoints
            const endpoint = id
                ? `http://localhost:5005/api/plexus/employee/salary/update/${id}`
                : 'http://localhost:5005/api/plexus/employee/salary/create';
            const method = id ? 'patch' : 'post';

            const response = await axios[method](endpoint, formDataToSend, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });

            toast.success(response.data.message || (id ? 'Salary updated successfully!' : 'Salary created successfully!'));
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
            month: '',
            year: '',
            pdf: null
        });
        setId(null);
        setErrors({});
        setSelectedFileName("");
        setCurrentFileName("");
        setVisible(false);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    // UPDATED handleEdit to show current file info
    const handleEdit = (salary) => {
        if (!isSubmitting) {
            setFormData({
                month: salary.month || '',
                year: salary.year || '',
                pdf: null
            });
            setId(salary._id);
            setSelectedFileName("");
            setCurrentFileName(salary.pdf || "");
            setVisible(true);
        }
    };

    const handleDelete = async (id) => {
        if (!isSubmitting && window.confirm("Are you sure you want to delete this salary record?")) {
            try {
                setIsSubmitting(true);
                const response = await axios.delete(`http://localhost:5005/api/plexus/employee/salary/delete/${id}`);
                toast.success(response.data.message || 'Salary deleted successfully!');
                getData();
            } catch (err) {
                console.error(err);
                toast.error(err.response?.data?.message || "An error occurred. Please try again.");
            } finally {
                setIsSubmitting(false);
            }
        }
    };

    // Generate month options
    const months = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ];

    const handleDownload = async (salary) => {
        setLoading(true);
        try {
            setSalaryData(salary.employees);
            setId(salary._id);
            setIsOpen(true);
            console.log(salary);
        } catch (error) {
            console.error('Error fetching salary data:', error);
        } finally {
            setLoading(false);
        }
    };

    // NEW FUNCTIONS FOR EMPLOYEE EDITING
    const handleEmployeeEdit = (employee) => {
        setEditingEmployee(employee._id);
        setEmployeeRemark(employee.remark || "");
    };

    const handleEmployeeUpdate = async (employeename) => {
        try {
            setIsUpdatingEmployee(true);

            // Call update API
            const response = await axios.patch(`http://localhost:5005/api/plexus/employee/salary/update/${id}`, {
                remark: employeeRemark,
                name: employeename
            });

            toast.success(response.data.message || 'Employee remark updated successfully!');

            // Update the local salaryData state to reflect changes immediately
            setSalaryData(prevData =>
                prevData.map(emp =>
                    emp.name === employeename
                        ? { ...emp, remark: employeeRemark }
                        : emp
                )
            );

            setEditingEmployee(null);
            setEmployeeRemark("");
        } catch (err) {
            console.error(err);
            toast.error(err.response?.data?.message || "Failed to update employee remark.");
        } finally {
            setIsUpdatingEmployee(false);
        }
    };

    const handleCancelEdit = () => {
        setEditingEmployee(null);
        setEmployeeRemark("");
    };

    const exportToCSV = () => {
        const headers = ['Name', 'Present Days', 'Absent Days', 'Weekly Off', 'Total Days', 'Total Salary', 'Pay Salary', 'Cut Salary', 'Remark'];
        const csvContent = [
            headers.join(','),
            ...salaryData.map(row => [
                `"${row.name}"`,
                row.present,
                row.absent,
                row.weeklyOff,
                row.totalDays,
                row.totalSalary,
                row.paySalary,
                row.cutSalary,
                `"${row.remark || ''}"`
            ].join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `salary_report_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
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
            <PageBreadcrumb pageTitle="Salary Management" />

            <div className="space-y-6 sticky left-0">
                <div
                    className={`rounded-2xl overflow-auto border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]`}
                    style={{ minHeight: "600px" }}
                >
                    {/* Card Header */}
                    <div className="px-6 pt-5">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center px-4 py-3 mt-4 dark:border-gray-800 border-gray-200 gap-4">
                            {/* Year Filter */}
                            <div className="flex items-center gap-4">
                                <div className="relative inline-block w-48" ref={yearFilterRef}>
                                    <button
                                        className="w-full flex items-center justify-between px-4 py-2 bg-white dark:border-gray-800 border rounded-md text-gray-600 hover:bg-gray-100 dark:bg-gray-800 dark:text-gray-300"
                                        onClick={() => setIsYearFilterOpen(!isYearFilterOpen)}
                                    >
                                        <span>{selectedYear || "All Years"}</span>
                                        <FontAwesomeIcon icon={faChevronDown} />
                                    </button>
                                    {isYearFilterOpen && (
                                        <div className="absolute left-0 z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg dark:bg-gray-800 dark:border-gray-700">
                                            <div className="py-1 px-1">
                                                <button
                                                    onClick={() => handleYearSelection("")}
                                                    className={`flex items-center w-full px-4 my-1 py-2 text-left text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-white/10 rounded-md ${selectedYear === "" ? "bg-gray-100 dark:bg-white/10" : ""}`}
                                                >
                                                    All Years
                                                </button>
                                                {years.map((year) => (
                                                    <button
                                                        key={year}
                                                        onClick={() => handleYearSelection(year)}
                                                        className={`flex items-center w-full px-4 py-2 my-1 text-left text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-white/10 rounded-md ${String(selectedYear) === String(year) ? "bg-gray-100 dark:bg-white/10" : ""}`}
                                                    >
                                                        {year}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Add Button */}
                            <div className="flex justify-end">
                                <div className="flex items-center gap-2">
                                    <Button
                                        onClick={() => toggleModal('add')}
                                        className="rounded-md border-0 shadow-md px-4 py-2 text-white"
                                        style={{ background: "#0777AB" }}
                                    >
                                        <FontAwesomeIcon icon={faPlus} className='pe-2' /> Add PDF
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
                                        <TableCell isHeader className="py-7 font-medium text-gray-500 dark:text-gray-300 px-2 border-r border-gray-200 dark:border-gray-700">Month</TableCell>
                                        <TableCell isHeader className="py-7 font-medium text-gray-500 dark:text-gray-300 px-2 border-r border-gray-200 dark:border-gray-700">Year</TableCell>
                                        <TableCell isHeader className="py-7 font-medium text-gray-500 dark:text-gray-300 px-2 border-r border-gray-200 dark:border-gray-700">PDF-File</TableCell>
                                        <TableCell isHeader className="py-7 font-medium text-gray-500 dark:text-gray-300 px-2 border-r border-gray-200 dark:border-gray-700">Report</TableCell>
                                        <TableCell isHeader className="py-7 font-medium text-gray-500 dark:text-gray-300 px-2 border-r border-gray-200 dark:border-gray-700">Actions</TableCell>
                                    </TableRow>
                                </TableHeader>
                                <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05] text-center">
                                    {filteredData.length > 0 ? (
                                        filteredData.map((salary, index) => (
                                            <TableRow key={salary._id}>
                                                <TableCell className="text-center px-2 border-r border-gray-200 dark:border-gray-700 dark:text-gray-200">
                                                    {index + 1}
                                                </TableCell>
                                                <TableCell className="py-3 px-2 border-r border-gray-200 dark:border-gray-700 dark:text-gray-200">
                                                    {salary.month}
                                                </TableCell>
                                                <TableCell className="py-3 px-2 border-r border-gray-200 dark:border-gray-700 dark:text-gray-200">
                                                    {salary.year}
                                                </TableCell>
                                                <TableCell className="py-3 px-2 border-r border-gray-200 dark:border-gray-700 dark:text-gray-200">
                                                    {salary.pdf ? (
                                                        <button
                                                            onClick={() => window.open(salary.pdf, '_blank')}
                                                            className="text-[#0777AB] transform transition-all duration-200 hover:scale-110"
                                                        >
                                                            <FontAwesomeIcon icon={faEye} className="text-lg" />
                                                        </button>
                                                    ) : '-'}
                                                </TableCell>
                                                <TableCell className="py-3 px-2 border-r border-gray-200 dark:border-gray-700 dark:text-gray-200">
                                                    {salary.pdf ? (
                                                        <button
                                                            className="text-[#0777AB] transform transition-all duration-200 hover:scale-110"
                                                            onClick={() => handleDownload(salary)}
                                                        >
                                                            <FontAwesomeIcon icon={faFileInvoice} className="text-lg text-green-600" />
                                                        </button>
                                                    ) : '-'}
                                                </TableCell>
                                                <TableCell className="py-3 px-2 border-r border-gray-200 dark:border-gray-700 dark:text-gray-200">
                                                    <div className="flex align-middle justify-center gap-4">
                                                        <button style={{ color: "#0385C3" }} onClick={() => handleEdit(salary)}>
                                                            <FontAwesomeIcon icon={faEdit} className="text-lg" />
                                                        </button>
                                                        <button className="text-red-600" onClick={() => handleDelete(salary._id)}>
                                                            <FontAwesomeIcon icon={faTrash} className="text-lg" />
                                                        </button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan={6} className="text-center pt-5 pb-4 dark:text-gray-200">No Data Found</td>
                                        </tr>
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </div>
                </div>
            </div>

            {/* Modal for Add/Edit Salary */}
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
                                {id ? "Edit PDF" : "Add PDF"}
                            </h3>
                        </div>

                        {/* Body */}
                        <div className="px-6 py-4">
                            <form onSubmit={handleSubmit}>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {/* Month */}
                                    <div className="mb-4">
                                        <label className="block font-medium mb-2">
                                            Month
                                            <span className="text-red-500 pl-2 font-normal text-lg">*</span>
                                        </label>
                                        <select
                                            name="month"
                                            value={formData.month}
                                            onChange={handleInputChange}
                                            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white ${errors.month ? 'border-red-500' : 'border-gray-300'
                                                }`}
                                            disabled={isSubmitting}
                                        >
                                            <option value="">Select Month</option>
                                            {months.map((month, index) => (
                                                <option key={index} value={month}>
                                                    {month}
                                                </option>
                                            ))}
                                        </select>
                                        {errors.month && (
                                            <p className="text-red-500 text-sm mt-1">{errors.month}</p>
                                        )}
                                    </div>

                                    {/* Year */}
                                    <div className="mb-4">
                                        <label className="block font-medium mb-2">
                                            Year
                                            <span className="text-red-500 pl-2 font-normal text-lg">*</span>
                                        </label>
                                        <select
                                            name="year"
                                            value={formData.year}
                                            onChange={handleInputChange}
                                            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white ${errors.year ? 'border-red-500' : 'border-gray-300'
                                                }`}
                                            disabled={isSubmitting}
                                        >
                                            <option value="">Select Year</option>
                                            {years.map((year) => (
                                                <option key={year} value={year}>
                                                    {year}
                                                </option>
                                            ))}
                                        </select>
                                        {errors.year && (
                                            <p className="text-red-500 text-sm mt-1">{errors.year}</p>
                                        )}
                                    </div>

                                    {/* PDF File Upload - UPDATED with current file display */}
                                    <div className="mb-4 md:col-span-2">
                                        <label className="block font-medium mb-2">
                                            Salary PDF <span className="text-xs">(PDF only - 5 MB max)</span>
                                            {!id && <span className="text-red-500 pl-2 font-normal text-lg">*</span>}
                                        </label>

                                        {/* Show current file info in edit mode */}
                                        {id && currentFileName && (
                                            <div className="mb-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                                                <div className="flex items-center gap-2">
                                                    <FontAwesomeIcon icon={faFileInvoice} className="text-blue-600" />
                                                    <span className="text-sm text-blue-800 dark:text-blue-200">
                                                        Current file: <strong>{currentFileName}</strong>
                                                    </span>
                                                </div>
                                            </div>
                                        )}

                                        <div className="flex flex-col">
                                            <input
                                                type="file"
                                                id="pdf"
                                                name="pdf"
                                                onChange={handleFileChange}
                                                disabled={isSubmitting}
                                                className="hidden"
                                                accept=".pdf"
                                                ref={fileInputRef}
                                            />

                                            <div className="grid gap-3 grid-cols-1">
                                                <div
                                                    onClick={() => !isSubmitting && fileInputRef.current?.click()}
                                                    onDragOver={onDragOver}
                                                    onDragLeave={onDragLeave}
                                                    onDrop={onDrop}
                                                    className={`flex flex-col items-center justify-center p-6 border-2 ${isDragging
                                                        ? "border-purple-600 bg-purple-50 dark:bg-gray-700 dark:border-gray-200"
                                                        : "dark:border-gray-200 border-dashed border-purple-500"
                                                        } rounded-lg cursor-pointer transition-all duration-300 ${isSubmitting ? "cursor-not-allowed opacity-70" : "hover:bg-gray-50"
                                                        }`}
                                                >
                                                    <FontAwesomeIcon
                                                        icon={isDragging ? faFileArrowUp : faArrowUpFromBracket}
                                                        className={`text-2xl mb-2 ${isDragging ? "text-purple-600 dark:text-gray-400" : "text-gray-400"
                                                            }`}
                                                    />
                                                    <div className="flex flex-col items-center gap-1 text-center">
                                                        {isDragging ? (
                                                            <span className="text-purple-600 dark:text-gray-400 font-medium">
                                                                Drop PDF file here
                                                            </span>
                                                        ) : (
                                                            <>
                                                                <span className="text-gray-500">
                                                                    {id ? "Drag & drop PDF file to update or" : "Drag & drop PDF file or"}
                                                                </span>
                                                                <span className="text-purple-600 font-medium dark:text-gray-400">
                                                                    Browse files
                                                                </span>
                                                            </>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Show selected file name */}
                                            {selectedFileName && (
                                                <p className="text-sm text-gray-600 mt-2 truncate">
                                                    Selected file: <span className="font-medium">{selectedFileName}</span>
                                                </p>
                                            )}
                                        </div>

                                        {errors.pdf && (
                                            <p className="text-red-500 text-sm mt-1">{errors.pdf}</p>
                                        )}
                                    </div>
                                </div>

                                {/* Footer */}
                                <div className="flex justify-end gap-3 pt-4 border-t">
                                    <Button
                                        variant="secondary"
                                        onClick={() => !isSubmitting && toggleModal('add')}
                                        disabled={isSubmitting}
                                        className="px-4 py-2 rounded-md border border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        type="submit"
                                        disabled={isSubmitting}
                                        className="px-4 py-2 rounded-md text-white border-0"
                                        style={{ background: "#0777AB" }}
                                    >
                                        {isSubmitting ? (
                                            <div className="flex items-center gap-2">
                                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                                {id ? "Updating..." : "Creating..."}
                                            </div>
                                        ) : (
                                            <>
                                                <FontAwesomeIcon icon={faSave} className="me-2" />
                                                {id ? "Update" : "Create"}
                                            </>
                                        )}
                                    </Button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* Employee Details Modal */}
            {isOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-99999">
                    <div className="bg-white dark:bg-gray-800 dark:text-gray-200 rounded-2xl shadow-2xl max-w-7xl w-full max-h-[90vh] overflow-hidden">
                        {/* Header */}
                        <div className="bg-[#0777AB] text-white p-6 relative">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <i className="fas fa-file-invoice-dollar text-3xl"></i>
                                    <div>
                                        <h2 className="text-2xl font-[400]">Salary Report</h2>
                                        <p className="text-blue-100 text-xs">Employee attendance and salary details</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setIsOpen(false)}
                                    className="p-2 rounded-full transition-all duration-200"
                                >
                                    <i className="fas fa-times text-xl"></i>
                                </button>
                            </div>


                        </div>

                        {/* Export Buttons */}
                        <div className="p-6 border-b border-gray-200">
                            <div className="flex flex-wrap gap-3 justify-end">
                                <button
                                    onClick={exportToCSV}
                                    className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-medium transition-all duration-200 flex items-center gap-2 shadow-md hover:shadow-lg transform hover:scale-105"
                                >
                                    <i className="fas fa-file-csv"></i>
                                    Export CSV
                                </button>
                            </div>
                        </div>

                        {/* Table */}
                        <div className="overflow-auto max-h-96">
                            <table className="w-full">
                                <thead className="bg-gray-50 sticky top-0 dark:bg-gray-800 dark:text-gray-200">
                                    <tr>
                                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 dark:text-gray-200 border-b border-gray-200">
                                            <i className="fas fa-user mr-2"></i>Employee Name
                                        </th>
                                        <th className="px-6 py-4 text-center text-sm font-semibold text-gray-900 dark:text-gray-200 border-b border-gray-200">
                                            <i className="fas fa-calendar mr-2"></i>Total Days
                                        </th>
                                        <th className="px-6 py-4 text-center text-sm font-semibold text-gray-900 dark:text-gray-200 border-b border-gray-200">
                                            <i className="fas fa-check-circle mr-2 text-green-600"></i>Present
                                        </th>
                                        <th className="px-6 py-4 text-center text-sm font-semibold text-gray-900 dark:text-gray-200 border-b border-gray-200">
                                            <i className="fas fa-times-circle mr-2 text-red-600"></i>Absent
                                        </th>
                                        <th className="px-6 py-4 text-center text-sm font-semibold text-gray-900 dark:text-gray-200 border-b border-gray-200">
                                            <i className="fas fa-calendar-minus mr-2 text-blue-600"></i>Weekly Off
                                        </th>
                                        <th className="px-6 py-4 text-center text-sm font-semibold text-gray-900 dark:text-gray-200 border-b border-gray-200">
                                            <i className="fas fa-money-bill-wave mr-2"></i>Total Salary
                                        </th>
                                        <th className="px-6 py-4 text-center text-sm font-semibold text-gray-900 dark:text-gray-200 border-b border-gray-200">
                                            <i className="fas fa-cut mr-2 text-red-600"></i>Cut Salary
                                        </th>
                                        <th className="px-6 py-4 text-center text-sm font-semibold text-gray-900 dark:text-gray-200 border-b border-gray-200">
                                            <i className="fas fa-hand-holding-usd mr-2 text-green-600"></i>Pay Salary
                                        </th>
                                        <th className="px-6 py-4 text-center text-sm font-semibold text-gray-900 dark:text-gray-200 border-b border-gray-200">
                                            <i className="fas fa-comment mr-2"></i>Remark
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {salaryData.map((employee, index) => (
                                        <tr key={employee._id} className={`hover:bg-gray-50 transition-colors dark:bg-gray-800 dark:text-gray-200 duration-150 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-25'}`}>
                                            <td className="px-6 py-4 border-b border-gray-200">
                                                <div className="flex items-center">
                                                    <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full flex items-center justify-center text-white font-semibold text-sm mr-3">
                                                        <i className="fas fa-user"></i>
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-semibold text-gray-900 dark:text-gray-200">{employee.name}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-center border-b border-gray-200">
                                                <span className="text-sm font-semibold text-gray-900 dark:text-gray-200">
                                                    {employee.totalDays}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-center border-b border-gray-200">
                                                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                                                    <i className="fas fa-check mr-1"></i>
                                                    {employee.present}
                                                </span>
                                            </td><td className="px-6 py-4 text-center border-b border-gray-200">
                                                <span
                                                    className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${employee.absent > 0 ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'} cursor-pointer relative group`}
                                                // title={employee.remark}
                                                >
                                                    <i className="fas fa-times mr-1"></i>
                                                    {employee.absent}

                                                    {/* Green dot if remark exists */}
                                                    {employee.remark && (
                                                        <span className="absolute -top-1 -right-1 h-[13px] w-[13px] rounded-full bg-green-500 border-2 border-white"></span>
                                                    )}

                                                    {/* Remark tooltip on hover */}
                                                    {employee.remark && (
                                                        <div className="absolute bottom-full min-w-52 left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-black text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-pre-wrap z-50 pointer-events-none">
                                                            {employee.remark}
                                                            <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-black"></div>
                                                        </div>
                                                    )}


                                                </span>
                                            </td>

                                            <td className="px-6 py-4 text-center border-b border-gray-200">
                                                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                                                    <i className="fas fa-calendar-day mr-1"></i>
                                                    {employee.weeklyOff}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-center border-b border-gray-200">
                                                <span className="text-sm font-semibold text-gray-900 dark:text-gray-200">
                                                    <i className="fas fa-rupee-sign mr-1"></i>
                                                    {Math.round(employee.totalSalary)}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-center border-b border-gray-200">
                                                <span className={`text-sm font-semibold ${employee.cutSalary > 0 ? 'text-red-600' : 'text-gray-900 dark:text-gray-200'}`}>
                                                    <i className="fas fa-rupee-sign mr-1"></i>
                                                    {Math.round(employee.cutSalary)}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-center border-b border-gray-200">
                                                <span className="text-sm font-semibold text-green-600">
                                                    <i className="fas fa-rupee-sign mr-1"></i>
                                                    {Math.round(employee.paySalary)}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-center border-b border-gray-200">
                                                {editingEmployee === employee._id ? (
                                                    <div className="flex items-center gap-2">
                                                        <textarea
                                                            value={employeeRemark}
                                                            onChange={(e) => setEmployeeRemark(e.target.value)}
                                                            placeholder="Enter remark..."
                                                            className="w-32 px-2 py-1 text-xs border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white resize-none"
                                                            rows="2"
                                                            disabled={isUpdatingEmployee}
                                                        />
                                                        <div className="flex flex-col gap-1">
                                                            <button
                                                                onClick={() => handleEmployeeUpdate(employee.name)}
                                                                disabled={isUpdatingEmployee}
                                                                className="text-green-600 hover:text-green-800 transition-colors p-1"
                                                                title="Save remark"
                                                            >
                                                                {isUpdatingEmployee ? (
                                                                    <div className="w-3 h-3 border border-green-600 border-t-transparent rounded-full animate-spin"></div>
                                                                ) : (
                                                                    <FontAwesomeIcon icon={faCheck} className="text-sm" />
                                                                )}
                                                            </button>
                                                            <button
                                                                onClick={handleCancelEdit}
                                                                disabled={isUpdatingEmployee}
                                                                className="text-red-600 hover:text-red-800 transition-colors p-1"
                                                                title="Cancel"
                                                            >
                                                                <FontAwesomeIcon icon={faTimes} className="text-sm" />
                                                            </button>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className="flex items-center justify-center gap-2">
                                                        {/* {employee.remark && (
                                                            <span className="text-xs text-gray-600 dark:text-gray-400 max-w-20 truncate" title={employee.remark}>
                                                                {employee.remark}
                                                            </span>
                                                        )} */}
                                                        <button
                                                            onClick={() => handleEmployeeEdit(employee)}
                                                            className="text-blue-600 hover:text-blue-800 transition-colors p-1"
                                                            title="Edit remark"
                                                        >
                                                            <FontAwesomeIcon icon={faEdit} className="text-sm" />
                                                        </button>
                                                    </div>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {/* Toast Container */}
            <ToastContainer position="top-center" className="!z-[99999]" />

        </div>
    );
};

export default Salary;