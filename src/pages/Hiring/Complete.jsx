import React, { useCallback, useEffect, useRef, useState } from "react";
import axios from "axios";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Table, TableBody, TableCell, TableHeader, TableRow } from "../../components/ui/table";
import { Button } from "react-bootstrap";
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEdit, faPlus, faTrash, faArrowUpFromBracket, faFileArrowUp, faEye, faArrowLeft, faUsers, faTimes, faSearch, faDownload } from "@fortawesome/free-solid-svg-icons";
import { useLocation, useNavigate } from "react-router-dom";
import CustomPagination from "../../components/common/pagination";

const Complete = () => {
    const [visible, setVisible] = useState(false);
    const [id, setId] = useState();
    const [loading, setLoading] = useState(true);
    const [errors, setErrors] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isOpen2, setIsOpen2] = useState(false);
    const [filteredData, setFilteredData] = useState([]);
    const [positions, setPositions] = useState([]);
    const [selectedPosition, setSelectedPosition] = useState(null);
    const [showPositionInput, setShowPositionInput] = useState(false);
    const [selectedFileName, setSelectedFileName] = useState('');
    const [isDragging, setIsDragging] = useState(false);
    const dropdownRef = useRef(null);
    const fileInputRef = useRef(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [suggestions, setSuggestions] = useState([]);
    const searchContainerRef = useRef(null);
    const [dateFilter, setDateFilter] = useState('all');
    const [customDateRange, setCustomDateRange] = useState({ start: '', end: '' });
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [originalData, setOriginalData] = useState([]);
    const dateFilterRef = useRef(null);
    const [experienceFilter, setExperienceFilter] = useState('all');
    const [showExperienceDropdown, setShowExperienceDropdown] = useState(false);
    const experienceFilterRef = useRef(null);

    const location = useLocation();
    const navigate = useNavigate();

    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(10); // You can make this configurable if needed

    // Add these computed values after your state declarations
    const totalItems = filteredData.length;
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const currentPageData = filteredData.slice(startIndex, endIndex);


    // Add this function to handle page changes
    const handlePageChange = (page) => {
        setCurrentPage(page);
    };

    // Form state for hiring data
    const [formData, setFormData] = useState({
        name: '',
        position: '',
        phonenumber: '',
        interviewdate: '',
        interviewtime: '',
        remark: '',
        resume: '',
        reference: '',
        experience: '',
        status: 'all'
    });

    // Check if coming from dashboard with selected position or add mode
    useEffect(() => {
        if (location.state?.selectedPosition) {
            setSelectedPosition(location.state.selectedPosition);
        }
        if (location.state?.addMode) {
            toggleModal('add');
            navigate(location.pathname, { replace: true, state: { ...location.state, addMode: false } });
        }
    }, [location.state]);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen2(false);
            }

            if (experienceFilterRef.current && !experienceFilterRef.current.contains(event.target)) {
                setShowExperienceDropdown(false);
            }

            if (searchContainerRef.current && !searchContainerRef.current.contains(event.target)) {
                setShowSuggestions(false);
            }

            if (dateFilterRef.current && !dateFilterRef.current.contains(event.target)) {
                setShowDatePicker(false);
            }
        };

        if (isOpen2) {
            document.addEventListener("mousedown", handleClickOutside);
        }

        if (showExperienceDropdown) {
            document.addEventListener("mousedown", handleClickOutside);
        }

        if (showSuggestions) {
            document.addEventListener("mousedown", handleClickOutside);
        }

        if (showDatePicker) {
            document.addEventListener("mousedown", handleClickOutside);
        }

        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
            document.removeEventListener("mousedown", handleClickOutside);
            document.removeEventListener("mousedown", handleClickOutside);
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [isOpen2, showExperienceDropdown, showSuggestions, showDatePicker]);

    const toggleModal = (mode) => {
        if (!isSubmitting) {
            if (mode === 'add') {
                setFormData({
                    name: '',
                    position: selectedPosition || '',
                    phonenumber: '',
                    interviewdate: '',
                    interviewtime: '',
                    remark: '',
                    resume: '',
                    reference: '',
                    experience: '',
                    status: 'all'
                });
                setId(undefined);
                setSelectedFileName('');
                setShowPositionInput(false);
            }
            setErrors({});
            setVisible(!visible);
        }
    };

    const handleBackToDashboard = () => {
        navigate('/management/hiring/data');
    };

    // Helper function to combine date and time
    const combineDateTime = (date, time) => {
        if (!date) return '';
        if (!time) return date;
        return `${date}T${time}`;
    };

    // Helper function to extract date and time from combined datetime
    const extractDateTime = (datetime) => {
        if (!datetime) return { date: '', time: '' };

        const dt = new Date(datetime);
        if (isNaN(dt.getTime())) {
            return {
                date: datetime.split('T')[0] || datetime,
                time: datetime.includes('T') ? datetime.split('T')[1] : ''
            };
        }

        const date = dt.toISOString().split('T')[0];
        const time = dt.toTimeString().slice(0, 5);
        return { date, time };
    };

    // date filter functions
    const getDateFilterOptions = useCallback(() => {
        const today = new Date();
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        const thisMonthStart = new Date(today.getFullYear(), today.getMonth(), 1);
        const thisMonthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0);

        const lastMonthStart = new Date(today.getFullYear(), today.getMonth() - 1, 1);
        const lastMonthEnd = new Date(today.getFullYear(), today.getMonth(), 0);

        const thisWeekStart = new Date(today);
        thisWeekStart.setDate(today.getDate() - today.getDay());
        const thisWeekEnd = new Date(thisWeekStart);
        thisWeekEnd.setDate(thisWeekStart.getDate() + 6);

        const lastWeekStart = new Date(thisWeekStart);
        lastWeekStart.setDate(thisWeekStart.getDate() - 7);
        const lastWeekEnd = new Date(thisWeekStart);
        lastWeekEnd.setDate(thisWeekStart.getDate() - 1);

        return {
            today: { start: today, end: today },
            tomorrow: { start: tomorrow, end: tomorrow },
            yesterday: { start: yesterday, end: yesterday },
            thisWeek: { start: thisWeekStart, end: thisWeekEnd },
            lastWeek: { start: lastWeekStart, end: lastWeekEnd },
            thisMonth: { start: thisMonthStart, end: thisMonthEnd },
            lastMonth: { start: lastMonthStart, end: lastMonthEnd }
        };
    }, []);

    const filterDataByDate = useCallback((data, filterType, customRange = null) => {
        if (filterType === 'all') return data;

        const options = getDateFilterOptions();
        let dateRange;

        if (filterType === 'custom' && customRange) {
            dateRange = {
                start: new Date(customRange.start),
                end: new Date(customRange.end)
            };
        } else {
            dateRange = options[filterType];
        }

        if (!dateRange) return data;

        return data.filter(item => {
            const itemDate = new Date(item.interviewdate);
            const startDate = new Date(dateRange.start);
            const endDate = new Date(dateRange.end);

            startDate.setHours(0, 0, 0, 0);
            endDate.setHours(23, 59, 59, 999);

            return itemDate >= startDate && itemDate <= endDate;
        });
    }, [getDateFilterOptions]);

    const getData = useCallback(async (page = 1) => {
        try {
            setLoading(true);
            const response = await axios.get('https://api.pslink.world/api/plexus/hiringresume/read');
            const data = response.data.data;

            setOriginalData(data);

            // Filter by selected position if available
            let positionFilteredData = data;
            if (selectedPosition) {
                positionFilteredData = data.filter(item => item.position === selectedPosition);
            }

            positionFilteredData = positionFilteredData.filter(item => item.status === "complete");

            // Apply experience filter
            if (experienceFilter !== 'all') {
                positionFilteredData = positionFilteredData.filter(item => item.experience === experienceFilter);
            }

            // Apply date filter
            const filteredData = filterDataByDate(positionFilteredData, dateFilter, customDateRange);
            setFilteredData(filteredData);

            // Extract unique positions for dropdown
            const uniquePositions = [...new Set(data.map(item => item.position).filter(Boolean))];
            setPositions(uniquePositions);

        } catch (err) {
            console.error(err);
            toast.error("Failed to fetch hiring data.");
        } finally {
            setLoading(false);
        }
    }, [dateFilter, customDateRange, filterDataByDate, selectedPosition, experienceFilter]);

    useEffect(() => {
        getData();
        setCurrentPage(1);
    }, [getData]);

    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, dateFilter, selectedPosition, experienceFilter]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));

        if (errors[name]) {
            setErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors[name];
                return newErrors;
            });
        }
    };

    const handlePositionSelect = (position) => {
        setFormData(prev => ({ ...prev, position }));
        setIsOpen2(false);
        setShowPositionInput(false);

        if (errors.position) {
            setErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors.position;
                return newErrors;
            });
        }
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const allowedTypes = ['application/pdf', 'text/plain', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
            if (!allowedTypes.includes(file.type)) {
                toast.error('Only PDF, TXT, DOC, and DOCX files are allowed');
                return;
            }

            if (file.size > 5 * 1024 * 1024) {
                toast.error('File size must be less than 5MB');
                return;
            }

            setSelectedFileName(file.name);
            setFormData(prev => ({ ...prev, resume: file }));

            if (errors.resume) {
                setErrors(prev => {
                    const newErrors = { ...prev };
                    delete newErrors.resume;
                    return newErrors;
                });
            }
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
            const file = files[0];

            const allowedTypes = ['application/pdf', 'text/plain', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
            if (!allowedTypes.includes(file.type)) {
                toast.error('Only PDF, TXT, DOC, and DOCX files are allowed');
                return;
            }

            if (file.size > 5 * 1024 * 1024) {
                toast.error('File size must be less than 5MB');
                return;
            }

            setSelectedFileName(file.name);
            setFormData(prev => ({ ...prev, resume: file }));

            if (errors.resume) {
                setErrors(prev => {
                    const newErrors = { ...prev };
                    delete newErrors.resume;
                    return newErrors;
                });
            }
        }
    };

    const validate = () => {
        const newErrors = {};

        if (!formData.name.trim()) newErrors.name = 'Name is required';
        if (!formData.position.trim()) newErrors.position = 'Position is required';
        if (!formData.phonenumber.trim()) newErrors.phonenumber = 'Phone number is required';
        if (!formData.resume) newErrors.resume = 'Resume is required';
        if (!formData.reference) newErrors.reference = 'Reference is required';
        if (!formData.experience.trim()) newErrors.experience = 'Experience is required';

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

            const submitData = new FormData();
            submitData.append('name', formData.name);
            submitData.append('position', formData.position);
            submitData.append('phonenumber', formData.phonenumber);
            submitData.append('reference', formData.reference);
            submitData.append('status', formData.status);
            submitData.append('experience', formData.experience);

            const combinedDateTime = combineDateTime(formData.interviewdate, formData.interviewtime);
            submitData.append('interviewdate', combinedDateTime);

            submitData.append('remark', formData.remark);

            if (formData.resume instanceof File) {
                submitData.append('resume', formData.resume);
            } else if (typeof formData.resume === 'string' && formData.resume) {
                submitData.append('resume', formData.resume);
            }

            const endpoint = id
                ? `https://api.pslink.world/api/plexus/hiringresume/update/${id}`
                : 'https://api.pslink.world/api/plexus/hiringresume/create';
            const method = id ? 'patch' : 'post';

            const response = await axios[method](endpoint, submitData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });

            toast.success(response.data.message || (id ? 'Hiring record updated successfully!' : 'Hiring record created successfully!'));
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
            position: selectedPosition || '',
            phonenumber: '',
            interviewdate: '',
            interviewtime: '',
            remark: '',
            resume: '',
            reference: '',
            experience: '',
            status: 'all'
        });
        setId(null);
        setErrors({});
        setVisible(false);
        setSelectedFileName('');
        setShowPositionInput(false);
    };

    const handleEdit = (item) => {
        if (!isSubmitting) {
            const { date, time } = extractDateTime(item.interviewdate);

            setFormData({
                name: item.name || '',
                position: item.position || '',
                phonenumber: item.phonenumber || '',
                interviewdate: date,
                interviewtime: time,
                remark: item.remark || '',
                resume: item.resume || '',
                reference: item.reference || '',
                experience: item.experience || '',
                status: item.status || 'all'
            });
            setId(item._id);
            setVisible(true);

            if (item.resume && typeof item.resume === 'string') {
                setSelectedFileName(item.resume.split('/').pop() || 'resume file');
            }
        }
    };

    const handleDelete = async (id) => {
        if (!isSubmitting && window.confirm("Are you sure you want to delete this hiring record?")) {
            try {
                setIsSubmitting(true);
                const response = await axios.delete(`https://api.pslink.world/api/plexus/hiringresume/delete/${id}`);
                toast.success(response.data.message || 'Hiring record deleted successfully!');
                getData();
            } catch (err) {
                console.error(err);
                toast.error(err.response?.data?.message || "An error occurred. Please try again.");
            } finally {
                setIsSubmitting(false);
            }
        }
    };

    const formatDateTime = (datetime) => {
        if (!datetime) return '-';

        const dt = new Date(datetime);
        if (isNaN(dt.getTime())) {
            if (datetime.includes('T')) {
                const [datePart, timePart] = datetime.split('T');
                const date = new Date(datePart).toLocaleDateString();
                return timePart ? `${date} ${timePart}` : date;
            }
            return new Date(datetime).toLocaleDateString();
        }

        return dt.toLocaleString();
    };

    const handleSearchSubmit = (e) => {
        e.preventDefault();
        setShowSuggestions(false);
    };

    const handleInputFocus = () => {
        if (searchTerm && suggestions.length > 0) {
            setShowSuggestions(true);
        }
    };

    const handleSuggestionClick = (suggestion) => {
        setSearchTerm(suggestion);
        const filtered = filteredData.filter(item =>
            item.name && item.name.toLowerCase().includes(suggestion.toLowerCase())
        );
        setFilteredData(filtered);
        setShowSuggestions(false);
    };

    const handleDateFilterChange = (filterType) => {
        setDateFilter(filterType);

        if (filterType === 'custom') {
            setShowDatePicker(true);
        } else {
            setShowDatePicker(false);
            let baseData = selectedPosition
                ? originalData.filter(item => item.position === selectedPosition)
                : originalData;
            const filteredData = filterDataByDate(baseData, filterType);
            setFilteredData(filteredData);
        }
    };

    const handleCustomDateChange = () => {
        if (customDateRange.start && customDateRange.end) {
            let baseData = selectedPosition
                ? originalData.filter(item => item.position === selectedPosition)
                : originalData;
            const filteredData = filterDataByDate(baseData, 'custom', customDateRange);
            setFilteredData(filteredData);
            setShowDatePicker(false)
        }
    };

    const getExperienceOptions = useCallback(() => {
        const experiences = originalData
            .filter(item => item.experience && item.experience.trim())
            .map(item => item.experience.trim());
        return [...new Set(experiences)].sort();
    }, [originalData])

    const handleSearch = (e) => {
        const value = e.target.value;
        setSearchTerm(value);

        let baseData = selectedPosition
            ? originalData.filter(item => item.position === selectedPosition)
            : originalData;

        // Apply experience filter
        if (experienceFilter !== 'all') {
            baseData = baseData.filter(item => item.experience === experienceFilter);
        }

        const dateFilteredData = filterDataByDate(baseData, dateFilter, customDateRange);

        if (value.trim()) {
            const filtered = dateFilteredData.filter(item =>
                item.name && item.name.toLowerCase().includes(value.toLowerCase())
            );
            setFilteredData(filtered);

            const nameSuggestions = [...new Set(
                dateFilteredData
                    .filter(item => item.name && item.name.toLowerCase().includes(value.toLowerCase()))
                    .map(item => item.name)
            )];
            setSuggestions(nameSuggestions);
            setShowSuggestions(nameSuggestions.length > 0);
        } else {
            setFilteredData(dateFilteredData);
            setSuggestions([]);
            setShowSuggestions(false);
        }
    };

    // Add this function to handle experience filter change
    const handleExperienceFilterChange = (experience) => {
        console.log(searchTerm.trim());


        setExperienceFilter(experience);
        setShowExperienceDropdown(false);

        let baseData = selectedPosition
            ? originalData.filter(item => item.position === selectedPosition)
            : originalData;

        // Apply experience filter
        if (experience !== 'all') {
            baseData = baseData.filter(item => item.experience === experience);
        }

        const dateFilteredData = filterDataByDate(baseData, dateFilter, customDateRange);

        // Apply search filter if search term exists
        if (searchTerm.trim()) {
            const searchFiltered = dateFilteredData.filter(item =>
                item.name && item.name.toLowerCase().includes(searchTerm.toLowerCase())
            );
            console.log(searchFiltered);

            setFilteredData(searchFiltered);
        } else {
            setFilteredData(dateFilteredData);
        }
    };

    const handleClearSearch = () => {
        setSearchTerm('');
        setShowSuggestions(false);
        setSuggestions([]);

        let baseData = selectedPosition
            ? originalData.filter(item => item.position === selectedPosition)
            : originalData;

        // Apply experience filter
        if (experienceFilter !== 'all') {
            baseData = baseData.filter(item => item.experience === experienceFilter);
        }

        const dateFilteredData = filterDataByDate(baseData, dateFilter, customDateRange);
        setFilteredData(dateFilteredData);
    };

    const DateFilterComponent = () => (
        <div className="relative" ref={dateFilterRef}>
            <div className="flex flex-wrap gap-2 items-center">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300 mr-2">Filter by:</span>
                <div className="flex flex-wrap gap-2">
                    {[
                        { key: 'all', label: 'All Time', icon: '📅' },
                        { key: 'today', label: 'Today', icon: '📆' },
                        { key: 'tomorrow', label: 'Tomorrow', icon: '🔮' },
                        { key: 'yesterday', label: 'Yesterday', icon: '📋' },
                        { key: 'thisWeek', label: 'This Week', icon: '📊' },
                        { key: 'lastWeek', label: 'Last Week', icon: '📈' },
                        { key: 'thisMonth', label: 'This Month', icon: '🗓️' },
                        { key: 'lastMonth', label: 'Last Month', icon: '📅' },
                        { key: 'custom', label: 'Custom Range', icon: '🎯' }
                    ].map((filter) => (
                        <button
                            key={filter.key}
                            onClick={() => handleDateFilterChange(filter.key)}
                            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${dateFilter === filter.key
                                ? 'bg-[#0777ab] text-white'
                                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                                }`}
                        >
                            <span className="mr-1">{filter.icon}</span>
                            {filter.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Custom Date Range Picker */}
            {showDatePicker && (
                <div className="absolute top-full left-0 mt-2 p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-10">
                    <div className="flex flex-col space-y-3">
                        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">Select Date Range</h4>
                        <div className="flex flex-col sm:flex-row gap-2">
                            <div className="flex flex-col">
                                <label className="text-xs text-gray-600 dark:text-gray-400 mb-1">From</label>
                                <input
                                    type="date"
                                    value={customDateRange.start}
                                    onChange={(e) => setCustomDateRange(prev => ({ ...prev, start: e.target.value }))}
                                    className="px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                                />
                            </div>
                            <div className="flex flex-col">
                                <label className="text-xs text-gray-600 dark:text-gray-400 mb-1">To</label>
                                <input
                                    type="date"
                                    value={customDateRange.end}
                                    onChange={(e) => setCustomDateRange(prev => ({ ...prev, end: e.target.value }))}
                                    className="px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                                />
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={handleCustomDateChange}
                                className="px-3 py-1 bg-[#0777AB] text-white rounded text-sm transition-colors"
                            >
                                Apply
                            </button>
                            <button
                                onClick={() => setShowDatePicker(false)}
                                className="px-3 py-1 bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded text-sm hover:bg-gray-400 dark:hover:bg-gray-500 transition-colors"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );

    // Main component return statement પણ બાકી છે
    return (
        <div>
            <div className="space-y-6 sticky left-0">
                <div
                    className={`rounded-2xl overflow-auto border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] transition-all duration-500 ease-in-out`}
                    style={{ minHeight: "600px" }}
                >
                    {/* Card Header */}
                    <div className="px-6">
                        <div className="flex justify-between items-center px-4 py-3 mt-4 dark:border-gray-800 border-gray-200 dark:text-gray-200">
                            <div className="flex items-center space-x-3">
                                <button
                                    onClick={handleBackToDashboard}
                                    className="rounded-md py-2 px-4 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors duration-200"
                                >
                                    <FontAwesomeIcon icon={faArrowLeft} className='pe-2' /> Back to Dashboard
                                </button>
                                {selectedPosition && (
                                    <span className="px-3 py-2 text-sm font-medium text-blue-700 bg-blue-100 dark:bg-blue-900 dark:text-blue-300 rounded-md">
                                        <FontAwesomeIcon icon={faUsers} className="mr-2" />
                                        {selectedPosition} ({filteredData.length})
                                    </span>
                                )}
                            </div>
                            <div className="flex gap-3">
                                {/* <button
                                    onClick={exportSelectedData}
                                    className="rounded-md border-0 shadow-md px-4 py-2 text-white transition-all duration-200 hover:shadow-lg transform hover:scale-[1.02]"
                                    style={{ background: "#28a745" }}
                                >
                                    <FontAwesomeIcon icon={faDownload} className='pe-2' /> Export PDF
                                </button> */}
                                <button
                                    onClick={() => toggleModal('add')}
                                    className="rounded-md border-0 shadow-md px-4 py-2 text-white transition-all duration-200 hover:shadow-lg transform hover:scale-[1.02]"
                                    style={{ background: "#0777AB" }}
                                >
                                    <FontAwesomeIcon icon={faPlus} className='pe-2' /> Add Candidate
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Card Body */}
                    <div className="p-4 border-gray-100 dark:border-gray-800 sm:p-6 overflow-auto">
                        <div className="transform transition-all duration-500 ease-in-out">

                            {/* Search and Filters Section */}
                            <div className="mb-6 space-y-4">
                                <div className="flex justify-between items-center py-6 flex-wrap pe-4 gap-4">
                                    {/* Search Container */}
                                    <div ref={searchContainerRef} className="relative">
                                        <form onSubmit={handleSearchSubmit}>
                                            <div className="relative display: flex align-middle justify-center">
                                                <span className="absolute -translate-y-1/2 pointer-events-none left-4 top-1/2">
                                                    <svg
                                                        className="fill-gray-500 dark:fill-gray-400"
                                                        width="20"
                                                        height="20"
                                                        viewBox="0 0 20 20"
                                                        fill="none"
                                                        xmlns="http://www.w3.org/2000/svg"
                                                    >
                                                        <path
                                                            fillRule="evenodd"
                                                            clipRule="evenodd"
                                                            d="M3.04175 9.37363C3.04175 5.87693 5.87711 3.04199 9.37508 3.04199C12.8731 3.04199 15.7084 5.87693 15.7084 9.37363C15.7084 12.8703 12.8731 15.7053 9.37508 15.7053C5.87711 15.7053 3.04175 12.8703 3.04175 9.37363ZM9.37508 1.54199C5.04902 1.54199 1.54175 5.04817 1.54175 9.37363C1.54175 13.6991 5.04902 17.2053 9.37508 17.2053C11.2674 17.2053 13.003 16.5344 14.357 15.4176L17.177 18.238C17.4699 18.5309 17.9448 18.5309 18.2377 18.238C18.5306 17.9451 18.5306 17.4703 18.2377 17.1774L15.418 14.3573C16.5365 13.0033 17.2084 11.2669 17.2084 9.37363C17.2084 5.04817 13.7011 1.54199 9.37508 1.54199Z"
                                                            fill=""
                                                        />
                                                    </svg>
                                                </span>
                                                <input
                                                    type="text"
                                                    placeholder="Search by candidate name..."
                                                    aria-label="Search by candidate name"
                                                    value={searchTerm}
                                                    onChange={handleSearch}
                                                    onFocus={handleInputFocus}
                                                    className="dark:bg-dark-900 h-11 w-full rounded-lg border border-gray-200 bg-transparent py-2.5 pl-12 pr-14 text-md text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-none focus:ring focus:ring-brand-500/10 dark:border-gray-800 dark:bg-gray-900 dark:bg-white/[0.03] dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800 xl:w-[430px]"
                                                />
                                                {searchTerm && (
                                                    <button
                                                        type="button"
                                                        className="absolute right-14 top-1/2 inline-flex -translate-y-1/2 items-center gap-0.5 focus:outline-none bg-none px-[7px] py-[4.5px] text-xs -tracking-[0.2px] text-gray-500 dark:border-gray-800 dark:bg-white/[0.03] dark:text-gray-400"
                                                        onClick={handleClearSearch}
                                                        style={{ cursor: "pointer" }}
                                                    >
                                                        <FontAwesomeIcon icon={faTimes} />
                                                    </button>
                                                )}
                                                <button
                                                    type="submit"
                                                    className="absolute right-2.5 top-1/2 inline-flex -translate-y-1/2 items-center gap-0.5 focus:outline-none bg-none px-[7px] py-[4.5px] text-xs -tracking-[0.2px] text-gray-500 dark:border-gray-800 dark:bg-white/[0.03] dark:text-gray-400"
                                                    style={{ cursor: "pointer" }}
                                                >
                                                    <FontAwesomeIcon icon={faSearch} />
                                                </button>
                                            </div>
                                        </form>

                                        {showSuggestions && suggestions.length > 0 && (
                                            <div className="absolute top-full left-0 w-full bg-white dark:bg-gray-900 dark:bg-white/[0.03] shadow-md p-2 flex flex-wrap items-center overflow-hidden z-30 border border-gray-200 dark:border-gray-800 rounded-lg">
                                                {loading ? (
                                                    <div className="p-2 text-gray-500 dark:text-gray-400">Loading...</div>
                                                ) : (
                                                    suggestions.slice(0, 10).map((suggestion, index) => (
                                                        <button
                                                            key={index}
                                                            className="px-3 py-1 rounded-md border mx-1 mb-1 text-sm cursor-pointer dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200"
                                                            onClick={() => handleSuggestionClick(suggestion)}
                                                        >
                                                            {suggestion}
                                                        </button>
                                                    ))
                                                )}
                                            </div>
                                        )}
                                    </div>

                                    {/* Experience Filter */}
                                    <div className="relative" ref={experienceFilterRef}>
                                        <button
                                            onClick={() => setShowExperienceDropdown(!showExperienceDropdown)}
                                            className="h-11 px-4 py-2 bg-white dark:bg-gray-900 dark:bg-white/[0.03] border border-gray-200 dark:border-gray-800 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors duration-200 flex items-center gap-2 min-w-[180px] justify-between"
                                        >
                                            <div className="flex items-center gap-2">
                                                <span className="text-sm">🎯</span>
                                                <span className="text-sm">
                                                    {experienceFilter === 'all' ? 'All Experience' : experienceFilter}
                                                </span>
                                            </div>
                                            <svg className={`w-4 h-4 transition-transform ${showExperienceDropdown ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                            </svg>
                                        </button>

                                        {showExperienceDropdown && (
                                            <div className="absolute top-full left-0 mt-1 w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg shadow-lg z-20 max-h-60 overflow-y-auto">
                                                <button
                                                    onClick={() => handleExperienceFilterChange('all')}
                                                    className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors ${experienceFilter === 'all' ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' : 'text-gray-700 dark:text-gray-300'
                                                        }`}
                                                >
                                                    All Experience
                                                </button>
                                                {getExperienceOptions().map((experience) => (
                                                    <button
                                                        key={experience}
                                                        onClick={() => handleExperienceFilterChange(experience)}
                                                        className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors ${experienceFilter === experience ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' : 'text-gray-700 dark:text-gray-300'
                                                            }`}
                                                    >
                                                        {experience}
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Date Filter Component */}
                                <div className="mb-4 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700">
                                    <DateFilterComponent />
                                </div>
                            </div>

                            {/* Data Table */}
                            <div className="transform transition-all duration-500 ease-in-out">
                                <div className="space-y-6 rounded-lg xl:border dark:border-gray-800">
                                    {loading ? (
                                        <div className="flex justify-center items-center h-64">
                                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                                        </div>
                                    ) : (
                                        <Table>
                                            <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
                                                <TableRow>
                                                    <TableCell isHeader className="py-4 font-medium text-gray-500 dark:text-gray-300 px-2 border-r border-gray-200 dark:border-gray-700">Index</TableCell>
                                                    <TableCell isHeader className="py-7 font-medium text-gray-500 dark:text-gray-300 px-2 border-r border-gray-200 dark:border-gray-700">Name</TableCell>
                                                    <TableCell isHeader className="py-7 font-medium text-gray-500 dark:text-gray-300 px-2 border-r border-gray-200 dark:border-gray-700">Position</TableCell>
                                                    <TableCell isHeader className="py-7 font-medium text-gray-500 dark:text-gray-300 px-2 border-r border-gray-200 dark:border-gray-700">Phone</TableCell>
                                                    <TableCell isHeader className="py-7 font-medium text-gray-500 dark:text-gray-300 px-2 border-r border-gray-200 dark:border-gray-700">Interview Date & Time</TableCell>
                                                    <TableCell isHeader className="py-7 font-medium text-gray-500 dark:text-gray-300 px-2 border-r border-gray-200 dark:border-gray-700">Experience</TableCell>
                                                    <TableCell isHeader className="py-7 font-medium text-gray-500 dark:text-gray-300 px-2 border-r border-gray-200 dark:border-gray-700">Reference</TableCell>
                                                    <TableCell isHeader className="py-7 font-medium text-gray-500 dark:text-gray-300 px-2 border-r border-gray-200 dark:border-gray-700">Remark</TableCell>
                                                    <TableCell isHeader className="py-7 font-medium text-gray-500 dark:text-gray-300 px-2 border-r border-gray-200 dark:border-gray-700">Resume</TableCell>
                                                    <TableCell isHeader className="py-7 font-medium text-gray-500 dark:text-gray-300 px-2 border-r border-gray-200 dark:border-gray-700">Actions</TableCell>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05] text-center">
                                                {currentPageData.length > 0 ? (
                                                    // Sort data by interview date in descending order (latest first)
                                                    currentPageData
                                                        .sort((a, b) => new Date(b.interviewdate) - new Date(a.interviewdate))
                                                        .map((item, index) => (
                                                            <TableRow
                                                                key={item._id}
                                                                className="transform transition-all duration-300 hover:bg-gray-50 dark:hover:bg-gray-800/50"
                                                                style={{
                                                                    animationDelay: `${index * 50}ms`,
                                                                    animation: 'fadeInLeft 0.4s ease-out forwards'
                                                                }}
                                                            >
                                                                <TableCell className="text-center px-2 border-r border-gray-200 dark:border-gray-700 dark:text-gray-200">
                                                                    {index + 1}
                                                                </TableCell>
                                                                <TableCell className="py-3 px-2 border-r border-gray-200 dark:border-gray-700 dark:text-gray-200">
                                                                    {item.name}
                                                                </TableCell>
                                                                <TableCell className="py-3 px-2 border-r border-gray-200 dark:border-gray-700 dark:text-gray-200">
                                                                    {item.position}
                                                                </TableCell>
                                                                <TableCell className="py-3 px-2 border-r border-gray-200 dark:border-gray-700 dark:text-gray-200">
                                                                    {item.phonenumber}
                                                                </TableCell>
                                                                <TableCell className="py-3 px-2 border-r border-gray-200 dark:border-gray-700 dark:text-gray-200">
                                                                    {formatDateTime(item.interviewdate)}
                                                                </TableCell>
                                                                <TableCell className="py-3 px-2 border-r border-gray-200 dark:border-gray-700 dark:text-gray-200">
                                                                    {item.experience}
                                                                </TableCell>
                                                                <TableCell className="py-3 px-2 border-r border-gray-200 dark:border-gray-700 dark:text-gray-200">
                                                                    {item.reference}
                                                                </TableCell>
                                                                <TableCell className="py-3 px-2 w-64 border-r border-gray-200 dark:border-gray-700 dark:text-gray-200">
                                                                    {item.remark ? item.remark : '-'}
                                                                </TableCell>
                                                                <TableCell className="py-3 px-2 border-r border-gray-200 dark:border-gray-700 dark:text-gray-200">
                                                                    {item.resume ? (
                                                                        <button
                                                                            onClick={() => window.open(item.resume, '_blank')}
                                                                            className="text-[#0777AB] transform transition-all duration-200 hover:scale-110"
                                                                        >
                                                                            <FontAwesomeIcon icon={faEye} className="text-lg" />
                                                                        </button>
                                                                    ) : '-'}
                                                                </TableCell>
                                                                <TableCell className="py-3 px-2 border-r border-gray-200 dark:border-gray-700 dark:text-gray-200">
                                                                    <div className="flex align-middle justify-center gap-4">
                                                                        <button
                                                                            style={{ color: "#0385C3" }}
                                                                            onClick={() => handleEdit(item)}
                                                                            className="transform transition-all duration-200 hover:scale-110"
                                                                            disabled={isSubmitting}
                                                                        >
                                                                            <FontAwesomeIcon icon={faEdit} className="text-lg" />
                                                                        </button>
                                                                        <button
                                                                            className="text-red-600 transform transition-all duration-200 hover:scale-110"
                                                                            onClick={() => handleDelete(item._id)}
                                                                            disabled={isSubmitting}
                                                                        >
                                                                            <FontAwesomeIcon icon={faTrash} className="text-lg" />
                                                                        </button>
                                                                    </div>
                                                                </TableCell>
                                                            </TableRow>
                                                        ))
                                                ) : (
                                                    <tr>
                                                        <td colSpan={10} className="text-center pt-5 pb-4 dark:text-gray-200">
                                                            No candidates found for {selectedPosition}
                                                        </td>
                                                    </tr>
                                                )}
                                            </TableBody>
                                        </Table>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Modal for Add/Edit Candidate */}
            {visible && (
                <div className="fixed inset-0 z-99999 flex items-center justify-center">
                    {/* Modal Backdrop */}
                    <div
                        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity duration-300"
                        onClick={() => !isSubmitting && toggleModal('add')}
                    ></div>

                    {/* Modal Content */}
                    <div className="relative bg-white rounded-lg w-full max-w-2xl mx-4 dark:bg-gray-800 dark:text-gray-200 max-h-[95vh] overflow-y-auto transform transition-all duration-300 scale-100">
                        {/* Header */}
                        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                            <h3 className="text-xl font-semibold">
                                {id ? "Edit Candidate" : "Add Candidate"}
                            </h3>
                        </div>

                        {/* Body */}
                        <div className="px-6 py-4">
                            <form onSubmit={handleSubmit}>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {/* Name */}
                                    <div className="mb-4">
                                        <label className="block font-medium mb-2">
                                            Name
                                            <span className="text-red-500 pl-2 font-normal text-lg">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            name="name"
                                            value={formData.name}
                                            onChange={handleInputChange}
                                            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white transition-all duration-200 ${errors.name ? 'border-red-500' : 'border-gray-300'
                                                }`}
                                            placeholder="Enter candidate name"
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
                                        <div className="relative" ref={dropdownRef}>
                                            <div className="flex">
                                                <input
                                                    type="text"
                                                    name="position"
                                                    value={formData.position}
                                                    onChange={handleInputChange}
                                                    className={`flex-1 px-3 py-2 border rounded-l-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white ${errors.position ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                                                        }`}
                                                    placeholder="Enter or select position"
                                                    disabled={isSubmitting}
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => !isSubmitting && setIsOpen2(!isOpen2)}
                                                    className="px-3 py-2 bg-gray-100 dark:bg-gray-600 border border-l-0 border-gray-300 dark:border-gray-600 rounded-r-lg hover:bg-gray-200 dark:hover:bg-gray-500 focus:outline-none transition-colors duration-200"
                                                >
                                                    ▼
                                                </button>
                                            </div>

                                            {isOpen2 && positions.length > 0 && (
                                                <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-10 max-h-48 overflow-y-auto">
                                                    {positions.map((position, index) => (
                                                        <button
                                                            key={index}
                                                            type="button"
                                                            onClick={() => handlePositionSelect(position)}
                                                            className="w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:bg-gray-100 dark:focus:bg-gray-700 transition-colors duration-200"
                                                        >
                                                            {position}
                                                        </button>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                        {errors.position && (
                                            <p className="text-red-500 text-sm mt-1">{errors.position}</p>
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
                                            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white transition-all duration-200 ${errors.phonenumber ? 'border-red-500' : 'border-gray-300'
                                                }`}
                                            placeholder="Enter phone number"
                                            disabled={isSubmitting}
                                        />
                                        {errors.phonenumber && (
                                            <p className="text-red-500 text-sm mt-1">{errors.phonenumber}</p>
                                        )}
                                    </div>

                                    {/* Interview Date */}
                                    <div className="mb-4">
                                        <label className="block font-medium mb-2">
                                            Interview Date
                                        </label>
                                        <input
                                            type="date"
                                            name="interviewdate"
                                            value={formData.interviewdate}
                                            onChange={handleInputChange}
                                            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white transition-all duration-200 ${errors.interviewdate ? 'border-red-500' : 'border-gray-300'
                                                }`}
                                            disabled={isSubmitting}
                                        />
                                        {errors.interviewdate && (
                                            <p className="text-red-500 text-sm mt-1">{errors.interviewdate}</p>
                                        )}
                                    </div>

                                    {/* Interview Time */}
                                    <div className="mb-4">
                                        <label className="block font-medium mb-2">
                                            Interview Time
                                        </label>
                                        <input
                                            type="time"
                                            name="interviewtime"
                                            value={formData.interviewtime}
                                            onChange={handleInputChange}
                                            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white transition-all duration-200 ${errors.interviewtime ? 'border-red-500' : 'border-gray-300'
                                                }`}
                                            disabled={isSubmitting}
                                        />
                                        {errors.interviewtime && (
                                            <p className="text-red-500 text-sm mt-1">{errors.interviewtime}</p>
                                        )}
                                    </div>

                                    {/* Experience */}
                                    <div className="mb-4">
                                        <label className="block font-medium mb-2">
                                            Experience
                                        </label>
                                        <select
                                            name="experience"
                                            value={formData.experience}
                                            onChange={handleInputChange}
                                            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white transition-all duration-200 ${errors.experience ? 'border-red-500' : 'border-gray-300'
                                                }`}
                                            disabled={isSubmitting}
                                        >
                                            <option value="">Select Experience</option>
                                            <option value="Fresher">Fresher</option>
                                            <option value="0-1">0-1 Years</option>
                                            <option value="1-2">1-2 Years</option>
                                            <option value="2-3">2-3 Years</option>
                                            <option value="3-4">3-4 Years</option>
                                            <option value="4-5">4-5 Years</option>
                                        </select>
                                        {errors.experience && (
                                            <p className="text-red-500 text-sm mt-1">{errors.experience}</p>
                                        )}
                                    </div>

                                    {/* Reference */}
                                    <div className="mb-4 md:col-span-2">
                                        <label className="block font-medium mb-2">
                                            Reference
                                            <span className="text-red-500 pl-2 font-normal text-lg">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            name="reference"
                                            value={formData.reference}
                                            onChange={handleInputChange}
                                            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white transition-all duration-200 ${errors.reference ? 'border-red-500' : 'border-gray-300'
                                                }`}
                                            placeholder="Enter reference information"
                                            disabled={isSubmitting}
                                        />
                                        {errors.reference && (
                                            <p className="text-red-500 text-sm mt-1">{errors.reference}</p>
                                        )}
                                    </div>


                                    {/* Remark */}
                                    <div className="mb-4 md:col-span-2">
                                        <label className="block font-medium mb-2">
                                            Remark
                                        </label>
                                        <textarea
                                            name="remark"
                                            value={formData.remark}
                                            onChange={handleInputChange}
                                            rows="3"
                                            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white transition-all duration-200 ${errors.remark ? 'border-red-500' : 'border-gray-300'
                                                }`}
                                            placeholder="Enter any remarks..."
                                            disabled={isSubmitting}
                                        />
                                    </div>

                                    <div className="mb-4 md:col-span-2">
                                        <label className="block font-medium mb-2">
                                            Status
                                        </label>
                                        <div className="flex gap-4">
                                            <label className="flex items-center">
                                                <input
                                                    type="radio"
                                                    name="status"
                                                    value="all"
                                                    checked={formData.status === 'all'}
                                                    onChange={handleInputChange}
                                                    className="mr-2 text-blue-500"
                                                    disabled={isSubmitting}
                                                />
                                                <span className="text-sm">All</span>
                                            </label>
                                            <label className="flex items-center">
                                                <input
                                                    type="radio"
                                                    name="status"
                                                    value="schedule"
                                                    checked={formData.status === 'schedule'}
                                                    onChange={handleInputChange}
                                                    className="mr-2 text-blue-500"
                                                    disabled={isSubmitting}
                                                />
                                                <span className="text-sm">Schedule</span>
                                            </label>
                                            <label className="flex items-center">
                                                <input
                                                    type="radio"
                                                    name="status"
                                                    value="complete"
                                                    checked={formData.status === 'complete'}
                                                    onChange={handleInputChange}
                                                    className="mr-2 text-blue-500"
                                                    disabled={isSubmitting}
                                                />
                                                <span className="text-sm">Complete</span>
                                            </label>
                                        </div>
                                        {errors.status && (
                                            <p className="text-red-500 text-sm mt-1">{errors.status}</p>
                                        )}
                                    </div>

                                    {/* Resume Upload */}
                                    <div className="mb-4 md:col-span-2">
                                        <label className="block font-medium mb-2">
                                            Resume <span className="text-xs">(PDF, TXT, DOC, DOCX - 5 MB)</span>
                                            <span className="text-red-500 pl-2 font-normal text-lg">*</span>
                                        </label>

                                        <div className="flex flex-col">
                                            <input
                                                type="file"
                                                id="resume"
                                                name="resume"
                                                onChange={handleFileChange}
                                                disabled={isSubmitting}
                                                className="hidden"
                                                accept=".pdf,.txt,.doc,.docx"
                                                ref={fileInputRef}
                                            />

                                            <div className="grid gap-3 grid-cols-1">
                                                <div
                                                    onClick={() => !isSubmitting && fileInputRef.current?.click()}
                                                    onDragOver={onDragOver}
                                                    onDragLeave={onDragLeave}
                                                    onDrop={onDrop}
                                                    className={`flex flex-col items-center justify-center p-6 border-2 ${isDragging
                                                        ? "border-blue-600 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-400"
                                                        : errors.resume
                                                            ? "border-red-500 bg-red-50 dark:bg-red-900/20"
                                                            : "dark:border-gray-600 border-dashed border-blue-500"
                                                        } rounded-lg cursor-pointer transition-all duration-300 ${isSubmitting ? "cursor-not-allowed opacity-70" : "hover:bg-gray-50 dark:hover:bg-gray-700/50"
                                                        }`}
                                                >
                                                    <FontAwesomeIcon
                                                        icon={isDragging ? faFileArrowUp : faArrowUpFromBracket}
                                                        className={`text-2xl mb-2 ${isDragging ? "text-blue-600 dark:text-blue-400" : "text-gray-400"
                                                            }`}
                                                    />
                                                    <div className="flex flex-col items-center gap-1 text-center">
                                                        {selectedFileName ? (
                                                            <div className="flex items-center space-x-2">
                                                                <FontAwesomeIcon icon={faFileArrowUp} className="text-green-500" />
                                                                <span className="text-sm text-gray-700 dark:text-gray-300">
                                                                    {selectedFileName}
                                                                </span>
                                                            </div>
                                                        ) : isDragging ? (
                                                            <span className="text-blue-600 dark:text-blue-400 font-medium">
                                                                Drop file here
                                                            </span>
                                                        ) : (
                                                            <>
                                                                <span className="text-gray-500 dark:text-gray-400">Drag & drop resume or</span>
                                                                <span className="text-blue-600 font-medium dark:text-blue-400">
                                                                    Browse files
                                                                </span>
                                                                <span className="text-xs text-gray-400 mt-1">PDF, TXT, DOC, DOCX (Max 5MB)</span>
                                                            </>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Show error if exists */}
                                            {errors.resume && (
                                                <p className="text-red-500 text-sm mt-1">{errors.resume}</p>
                                            )}
                                        </div>
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

            {totalPages > 0 && (
                <CustomPagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={handlePageChange}
                    itemsPerPage={itemsPerPage}
                    totalItems={totalItems}
                />
            )}

            <ToastContainer position="top-center" className="!z-[99999]" />
        </div>
    );
};

export default Complete;