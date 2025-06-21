import React, { useEffect, useRef, useState } from "react";
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

const HiringResume = () => {
    const [visible, setVisible] = useState(false);
    const [id, setId] = useState();
    const [loading, setLoading] = useState(true);
    const [errors, setErrors] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isOpen2, setIsOpen2] = useState(false);
    const [filteredData, setFilteredData] = useState([]);
    const [positions, setPositions] = useState([]);
    const [positionStats, setPositionStats] = useState([]);
    const [selectedPosition, setSelectedPosition] = useState(null);
    const [showPositionInput, setShowPositionInput] = useState(false);
    const [selectedFileName, setSelectedFileName] = useState('');
    const [previewUrl, setPreviewUrl] = useState('');
    const [isDragging, setIsDragging] = useState(false);
    const [showTable, setShowTable] = useState(false);
    const dropdownRef = useRef(null);
    const fileInputRef = useRef(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [suggestions, setSuggestions] = useState([]);
    const searchContainerRef = useRef(null);
    const [dateFilter, setDateFilter] = useState('all');
    const [customDateRange, setCustomDateRange] = useState({ start: '', end: '' });
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [originalData, setOriginalData] = useState([]); // To store unfiltered data
    const dateFilterRef = useRef(null);

    // Form state for hiring data
    const [formData, setFormData] = useState({
        name: '',
        position: '',
        phonenumber: '',
        interviewdate: '',
        interviewtime: '',
        remark: '',
        resume: ''
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
                    phonenumber: '',
                    interviewdate: '',
                    interviewtime: '',
                    remark: '',
                    resume: ''
                });
                setId(undefined);
                setSelectedFileName('');
                setPreviewUrl('');
                setShowPositionInput(false);
            }
            setErrors({});
            setVisible(!visible);
        }
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
            // If it's just a date string without time
            return {
                date: datetime.split('T')[0] || datetime,
                time: datetime.includes('T') ? datetime.split('T')[1] : ''
            };
        }

        const date = dt.toISOString().split('T')[0];
        const time = dt.toTimeString().slice(0, 5); // HH:MM format
        return { date, time };
    };

    // Generate random colors for position boxes
    // Get color from localStorage or generate and store
    const getFixedColor = (position) => {
        const storedColors = JSON.parse(localStorage.getItem('positionColors')) || {};
        if (storedColors[position]) {
            return storedColors[position];
        }

        const colors = [
            'bg-[#14B8A6]', 'bg-[#06B6D4]', 'bg-[#EAB308]', 'bg-[#A855F7]',
        ];

        // Filter out already used colors
        const usedColors = Object.values(storedColors);
        const availableColors = colors.filter(color => !usedColors.includes(color));
        const color = availableColors.length > 0
            ? availableColors[Math.floor(Math.random() * availableColors.length)]
            : colors[Math.floor(Math.random() * colors.length)]; // fallback

        storedColors[position] = color;
        localStorage.setItem('positionColors', JSON.stringify(storedColors));
        return color;
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

    const handlePositionClick = (position) => {
        setSelectedPosition(position);
        setShowTable(true);
    };

    const handleBackToPositions = () => {
        setShowTable(false);
        setSelectedPosition(null);
    };

    const getPositionData = () => {
        if (!selectedPosition) return [];
        return filteredData.filter(item => item.position === selectedPosition);
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            // Validate file type
            const allowedTypes = ['application/pdf', 'text/plain', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
            if (!allowedTypes.includes(file.type)) {
                toast.error('Only PDF, TXT, DOC, and DOCX files are allowed');
                return;
            }

            // Validate file size (5MB)
            if (file.size > 5 * 1024 * 1024) {
                toast.error('File size must be less than 5MB');
                return;
            }

            setSelectedFileName(file.name);
            setFormData(prev => ({ ...prev, resume: file }));

            // Create preview for supported file types
            if (file.type === 'application/pdf') {
                const fileURL = URL.createObjectURL(file);
                setPreviewUrl(fileURL);
            } else {
                setPreviewUrl('');
            }

            // Clear error
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

            // Validate file type
            const allowedTypes = ['application/pdf', 'text/plain', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
            if (!allowedTypes.includes(file.type)) {
                toast.error('Only PDF, TXT, DOC, and DOCX files are allowed');
                return;
            }

            // Validate file size (5MB)
            if (file.size > 5 * 1024 * 1024) {
                toast.error('File size must be less than 5MB');
                return;
            }

            setSelectedFileName(file.name);
            setFormData(prev => ({ ...prev, resume: file }));

            // Create preview for PDF
            if (file.type === 'application/pdf') {
                const fileURL = URL.createObjectURL(file);
                setPreviewUrl(fileURL);
            } else {
                setPreviewUrl('');
            }

            // Clear error
            if (errors.resume) {
                setErrors(prev => {
                    const newErrors = { ...prev };
                    delete newErrors.resume;
                    return newErrors;
                });
            }
        }
    };

    const currentItems = showTable ? getPositionData() : filteredData;

    const validate = () => {
        const newErrors = {};

        // Required fields validation
        if (!formData.name.trim()) newErrors.name = 'Name is required';
        if (!formData.position.trim()) newErrors.position = 'Position is required';
        if (!formData.phonenumber.trim()) newErrors.phonenumber = 'Phone number is required';
        if (!formData.resume) newErrors.resume = 'Resume is required';

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

            // Create FormData for file upload
            const submitData = new FormData();
            submitData.append('name', formData.name);
            submitData.append('position', formData.position);
            submitData.append('phonenumber', formData.phonenumber);

            // Combine date and time before sending
            const combinedDateTime = combineDateTime(formData.interviewdate, formData.interviewtime);
            submitData.append('interviewdate', combinedDateTime);

            submitData.append('remark', formData.remark);

            if (formData.resume instanceof File) {
                submitData.append('resume', formData.resume);
            } else if (typeof formData.resume === 'string' && formData.resume) {
                submitData.append('resume', formData.resume);
            }

            const endpoint = id
                ? `http://localhost:5005/api/hiring/update/${id}`
                : 'http://localhost:5005/api/hiring/create';
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
            position: '',
            phonenumber: '',
            interviewdate: '',
            interviewtime: '',
            remark: '',
            resume: ''
        });
        setId(null);
        setErrors({});
        setVisible(false);
        setSelectedFileName('');
        setPreviewUrl('');
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
                resume: item.resume || ''
            });
            setId(item._id);
            setVisible(true);

            // Set filename if resume exists
            if (item.resume && typeof item.resume === 'string') {
                setSelectedFileName(item.resume.split('/').pop() || 'resume file');
            }
        }
    };

    const handleDelete = async (id) => {
        if (!isSubmitting && window.confirm("Are you sure you want to delete this hiring record?")) {
            try {
                setIsSubmitting(true);
                const response = await axios.delete(`http://localhost:5005/api/hiring/delete/${id}`);
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

    // Helper function to format datetime for display
    const formatDateTime = (datetime) => {
        if (!datetime) return '-';

        const dt = new Date(datetime);
        if (isNaN(dt.getTime())) {
            // If it's just a date string
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
    // Add click outside handler
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (searchContainerRef.current && !searchContainerRef.current.contains(event.target)) {
                setShowSuggestions(false);
            }
        };

        if (showSuggestions) {
            document.addEventListener("mousedown", handleClickOutside);
        }

        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [showSuggestions]);

    // date fillter 
    const getDateFilterOptions = () => {
        const today = new Date();
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        const thisMonthStart = new Date(today.getFullYear(), today.getMonth(), 1);
        const thisMonthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0); // Last day of current month

        const lastMonthStart = new Date(today.getFullYear(), today.getMonth() - 1, 1);
        const lastMonthEnd = new Date(today.getFullYear(), today.getMonth(), 0);

        const thisWeekStart = new Date(today);
        thisWeekStart.setDate(today.getDate() - today.getDay());
        const thisWeekEnd = new Date(thisWeekStart);
        thisWeekEnd.setDate(thisWeekStart.getDate() + 6); // End of current week

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
    };

    // Add this function to filter data by date
    const filterDataByDate = (data, filterType, customRange = null) => {
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

            // Set time to start and end of day for proper comparison
            startDate.setHours(0, 0, 0, 0);
            endDate.setHours(23, 59, 59, 999);

            return itemDate >= startDate && itemDate <= endDate;
        });
    };

    // Update your getData function to store original data
    const getData = async (page = 1) => {
        try {
            setLoading(true);
            const response = await axios.get('http://localhost:5005/api/hiring/read');
            const data = response.data.data;

            // Store original data
            setOriginalData(data);

            // Apply current date filter
            const filteredData = filterDataByDate(data, dateFilter, customDateRange);
            setFilteredData(filteredData);

            // Extract unique positions for dropdown
            const uniquePositions = [...new Set(data.map(item => item.position).filter(Boolean))];
            setPositions(uniquePositions);

            // Create position statistics from filtered data
            const positionCounts = filteredData.reduce((acc, item) => {
                if (item.position) {
                    acc[item.position] = (acc[item.position] || 0) + 1;
                }
                return acc;
            }, {});

            const positionStatsArray = Object.entries(positionCounts).map(([position, count]) => ({
                position,
                count,
                color: getFixedColor(position)
            }));
            setPositionStats(positionStatsArray);
        } catch (err) {
            console.error(err);
            toast.error("Failed to fetch hiring data.");
        } finally {
            setLoading(false);
        }
    };

    // Add date filter change handler
    const handleDateFilterChange = (filterType) => {
        setDateFilter(filterType);

        if (filterType === 'custom') {
            setShowDatePicker(true);
        } else {
            setShowDatePicker(false);
            const filteredData = filterDataByDate(originalData, filterType);
            setFilteredData(filteredData);

            // Update position stats
            const positionCounts = filteredData.reduce((acc, item) => {
                if (item.position) {
                    acc[item.position] = (acc[item.position] || 0) + 1;
                }
                return acc;
            }, {});

            const positionStatsArray = Object.entries(positionCounts).map(([position, count]) => ({
                position,
                count,
                color: getFixedColor(position)
            }));
            setPositionStats(positionStatsArray);
        }
    };

    // Add custom date range handler
    const handleCustomDateChange = () => {
        if (customDateRange.start && customDateRange.end) {
            const filteredData = filterDataByDate(originalData, 'custom', customDateRange);
            setFilteredData(filteredData);

            // Update position stats
            const positionCounts = filteredData.reduce((acc, item) => {
                if (item.position) {
                    acc[item.position] = (acc[item.position] || 0) + 1;
                }
                return acc;
            }, {});

            const positionStatsArray = Object.entries(positionCounts).map(([position, count]) => ({
                position,
                count,
                color: getFixedColor(position)
            }));
            setPositionStats(positionStatsArray);
        }
    };

    // Add click outside handler for date filter
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dateFilterRef.current && !dateFilterRef.current.contains(event.target)) {
                setShowDatePicker(false);
            }
        };

        if (showDatePicker) {
            document.addEventListener("mousedown", handleClickOutside);
        }

        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [showDatePicker]);

    // Update your search handler to work with filtered data
    const handleSearch = (e) => {
        const value = e.target.value;
        setSearchTerm(value);

        // Get currently filtered data by date
        const dateFilteredData = filterDataByDate(originalData, dateFilter, customDateRange);

        if (value.trim()) {
            // Filter by name within date-filtered data
            const filtered = dateFilteredData.filter(item =>
                item.name && item.name.toLowerCase().includes(value.toLowerCase())
            );
            setFilteredData(filtered);

            // Generate suggestions from date-filtered data
            const nameSuggestions = [...new Set(
                dateFilteredData
                    .filter(item => item.name && item.name.toLowerCase().includes(value.toLowerCase()))
                    .map(item => item.name)
            )];
            setSuggestions(nameSuggestions);
            setShowSuggestions(nameSuggestions.length > 0);
        } else {
            // Reset to date-filtered data when search is empty
            setFilteredData(dateFilteredData);
            setSuggestions([]);
            setShowSuggestions(false);
        }
    };

    // Update your clear search handler
    const handleClearSearch = () => {
        setSearchTerm('');
        setShowSuggestions(false);
        setSuggestions([]);
        // Reset to date-filtered data
        const dateFilteredData = filterDataByDate(originalData, dateFilter, customDateRange);
        setFilteredData(dateFilteredData);
    };

    // JSX for the Date Filter Component (add this right after the search component in your table view)
    const DateFilterComponent = () => (
        <div className="relative" ref={dateFilterRef}>
            <div className="flex flex-wrap gap-2 items-center">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300 mr-2">Filter by:</span>
                {/* Predefined Filter Buttons */}
                <div className="flex flex-wrap gap-2">
                    {[
                        { key: 'all', label: 'All Time', icon: '📅' },
                        { key: 'today', label: 'Today', icon: '📆' },
                        { key: 'tomorrow', label: 'Tomorrow', icon: '🔜' },
                        { key: 'yesterday', label: 'Yesterday', icon: '📋' },
                        { key: 'thisWeek', label: 'This Week', icon: '🗓️' },
                        { key: 'lastWeek', label: 'Last Week', icon: '📊' },
                        { key: 'thisMonth', label: 'This Month', icon: '🗂️' },
                        { key: 'lastMonth', label: 'Last Month', icon: '📁' },
                        { key: 'custom', label: 'Custom Range', icon: '🎯' }
                    ].map((filter) => (
                        <button
                            key={filter.key}
                            onClick={() => handleDateFilterChange(filter.key)}
                            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 flex items-center gap-1 ${dateFilter === filter.key
                                ? 'bg-[#0777AB] text-white shadow-md transform scale-105'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
                                }`}
                        >
                            <span>{filter.icon}</span>
                            {filter.label}
                        </button>
                    ))}
                </div>
            </div>
            {/* Custom Date Range Picker */}
            {showDatePicker && dateFilter === 'custom' && (
                <div className="absolute top-full left-0 mt-2 p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50 min-w-[300px]">
                    <div className="flex flex-col gap-3">
                        <h4 className="font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                            <span>🎯</span>
                            Custom Date Range
                        </h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                                    Start Date
                                </label>
                                <input
                                    type="date"
                                    value={customDateRange.start}
                                    onChange={(e) => setCustomDateRange(prev => ({ ...prev, start: e.target.value }))}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                                    End Date
                                </label>
                                <input
                                    type="date"
                                    value={customDateRange.end}
                                    onChange={(e) => setCustomDateRange(prev => ({ ...prev, end: e.target.value }))}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                                />
                            </div>
                        </div>
                        <div className="flex gap-2 justify-end mt-2">
                            <button
                                onClick={() => {
                                    setShowDatePicker(false);
                                    setDateFilter('all');
                                    setCustomDateRange({ start: '', end: '' });
                                }}
                                className="px-3 py-1.5 text-xs bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 dark:bg-gray-600 dark:text-gray-300 dark:hover:bg-gray-500"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => {
                                    handleCustomDateChange();
                                    setShowDatePicker(false);
                                }}
                                disabled={!customDateRange.start || !customDateRange.end}
                                className="px-3 py-1.5 text-xs bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Apply Filter
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );

    const exportSelectedData = () => {
        const pdf = new jsPDF();
        pdf.setFontSize(16);
        pdf.text('Hiring Resume Data Export', 14, 15);

        let yPos = 25;

        if (showTable && selectedPosition) {
            // Export data for specific position
            const positionData = getPositionData();
            pdf.setFontSize(14);
            pdf.text(`Position: ${selectedPosition}`, 14, yPos);
            yPos += 10;
            pdf.text(`Total Candidates: ${positionData.length}`, 14, yPos);
            yPos += 15;

            if (positionData.length > 0) {
                // Prepare table data
                const tableHeaders = ['#', 'Name', 'Phone', 'Interview Date & Time', 'Remark'];
                const tableData = positionData.map((item, index) => [
                    index + 1,
                    item.name || '-',
                    item.phonenumber || '-',
                    formatDateTime(item.interviewdate),
                    item.remark || '-'
                ]);

                // Create the table
                autoTable(pdf, {
                    startY: yPos,
                    head: [tableHeaders],
                    body: tableData,
                    margin: { left: 14 },
                    theme: 'grid',
                    styles: {
                        overflow: 'linebreak',
                        fontSize: 10
                    },
                    headStyles: {
                        fillColor: [7, 119, 171], // #0777AB color
                        textColor: [255, 255, 255],
                        fontStyle: 'bold'
                    },
                    columnStyles: {
                        0: { halign: 'center', cellWidth: 15 },
                        1: { cellWidth: 40 },
                        2: { cellWidth: 30 },
                        3: { cellWidth: 40 },
                        4: { cellWidth: 50 }
                    }
                });
            }

            pdf.save(`${selectedPosition}_candidates_export.pdf`);
        } else {
            // Export overall position statistics
            pdf.setFontSize(14);
            pdf.text('Positions Overview', 14, yPos);
            yPos += 10;

            const totalCandidates = filteredData.length;
            pdf.text(`Total Candidates: ${totalCandidates}`, 14, yPos);
            yPos += 10;
            pdf.text(`Total Positions: ${positionStats.length}`, 14, yPos);
            yPos += 15;

            if (positionStats.length > 0) {
                // Prepare position statistics table
                const tableHeaders = ['Position', 'Number of Candidates'];
                const tableData = positionStats.map(stat => [
                    stat.position,
                    stat.count
                ]);

                // Add total row
                tableData.push(['Total', totalCandidates]);

                // Create the table
                autoTable(pdf, {
                    startY: yPos,
                    head: [tableHeaders],
                    body: tableData,
                    margin: { left: 14 },
                    theme: 'grid',
                    styles: {
                        overflow: 'linebreak',
                        fontSize: 12
                    },
                    headStyles: {
                        fillColor: [7, 119, 171], // #0777AB color
                        textColor: [255, 255, 255],
                        fontStyle: 'bold'
                    },
                    columnStyles: {
                        0: { cellWidth: 100 },
                        1: { halign: 'center', cellWidth: 50 }
                    },
                    didParseCell: function (data) {
                        // Highlight the total row
                        if (data.row.index === tableData.length - 1) {
                            data.cell.styles.fontStyle = 'bold';
                            data.cell.styles.fillColor = [240, 240, 240];
                        }
                    }
                });
            }

            pdf.save('hiring_positions_overview_export.pdf');
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
            <PageBreadcrumb pageTitle="Hiring Management" />
            <div className="space-y-6 sticky left-0">
                <div
                    className={`rounded-2xl overflow-auto border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] transition-all duration-500 ease-in-out`}
                    style={{ minHeight: "600px" }}
                >
                    {/* Card Header */}
                    <div className="px-6">
                        <div className="flex justify-between items-center px-4 py-3 mt-4 dark:border-gray-800 border-gray-200 dark:text-gray-200">
                            <div>
                                {showTable && (
                                    <Button
                                        onClick={handleBackToPositions}
                                        className="rounded-md py-2 mr-3"
                                    >
                                        <FontAwesomeIcon icon={faArrowLeft} className='pe-2' /> Back
                                    </Button>
                                )}
                            </div>
                            <div className="flex gap-3">
                                <Button
                                    onClick={exportSelectedData}
                                    className="rounded-md border-0 shadow-md px-4 py-2 text-white"
                                    style={{ background: "#28a745" }}
                                >
                                    <FontAwesomeIcon icon={faDownload} className='pe-2' /> Export PDF
                                </Button>
                                <Button
                                    onClick={() => toggleModal('add')}
                                    className="rounded-md border-0 shadow-md px-4 py-2 text-white"
                                    style={{ background: "#0777AB" }}
                                >
                                    <FontAwesomeIcon icon={faPlus} className='pe-2' /> Add Candidate
                                </Button>
                            </div>
                        </div>
                    </div>

                    {/* Card Body */}
                    <div className="p-4 border-gray-100 dark:border-gray-800 sm:p-6 overflow-auto">
                        {!showTable ? (
                            // Position Boxes View
                            <div className="transform transition-all duration-500 ease-in-out">
                                <h2 className="text-2xl font-[600] mb-6 text-gray-800 dark:text-gray-200">
                                    Positions Overview
                                </h2>
                                {positionStats.length > 0 ? (
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                        {positionStats.map((stat, index) => (
                                            <div
                                                key={index}
                                                onClick={() => handlePositionClick(stat.position)}
                                                className={`${stat.color} rounded-xl p-6 text-white cursor-pointer transform transition-all duration-300 hover:scale-[1.01] hover:shadow-md hover:-translate-y-1`}
                                                style={{
                                                    animationDelay: `${index * 100}ms`,
                                                    animation: 'fadeInUp 0.6s ease-out forwards'
                                                }}
                                            >
                                                <div className="flex items-center justify-between">
                                                    <div>
                                                        <h3 className="text-lg font-semibold mb-2 truncate">
                                                            {stat.position}
                                                        </h3>
                                                        <div className="flex items-center">
                                                            <FontAwesomeIcon icon={faUsers} className="mr-2" />
                                                            <span className="text-2xl font-bold">{stat.count}</span>
                                                        </div>
                                                        <p className="text-sm opacity-90 mt-1">
                                                            {stat.count === 1 ? 'Candidate' : 'Candidates'}
                                                        </p>
                                                    </div>
                                                    <div className="text-right">
                                                        <div className="w-12 h-12 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                                                            <FontAwesomeIcon icon={faEye} className="text-xl" />
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-12">
                                        <div className="text-gray-400 text-6xl mb-4">
                                            <FontAwesomeIcon icon={faUsers} />
                                        </div>
                                        <h3 className="text-lg font-medium text-gray-500 dark:text-gray-400 mb-2">
                                            No Positions Available
                                        </h3>
                                        <p className="text-gray-400 dark:text-gray-500">
                                            Add some candidates to see position statistics
                                        </p>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <>

                                <div className="pt-4 border-t  border-gray-200 dark:border-gray-800">
                                    <h2 className="text-2xl font-[500] text-gray-800 dark:text-gray-200">
                                        {selectedPosition} - Candidates ({getPositionData().length})
                                    </h2>
                                </div>
                                <div className="flex justify-between items-center py-6 flex-wrap pe-4">
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
                                                    placeholder="Search by Name..."
                                                    aria-label="Search by Name"
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

                                        {showSuggestions && (
                                            <div className="absolute top-full left-0 w-full bg-white dark:bg-gray-900 dark:bg-white/[0.03] shadow-md p-2 flex flex-wrap items-center overflow-hidden z-30 border border-gray-200 dark:border-gray-800 rounded-lg">
                                                {loading ? (
                                                    <div className="p-2 text-gray-500 dark:text-gray-400">Loading...</div>
                                                ) : suggestions.length > 0 ? (
                                                    suggestions.slice(0, 10).map((suggestion, index) => (
                                                        <button
                                                            key={index}
                                                            className="px-3 py-1 rounded-md border mx-1 mb-1 text-sm cursor-pointer dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200"
                                                            onClick={() => handleSuggestionClick(suggestion)}
                                                        >
                                                            {suggestion}
                                                        </button>
                                                    ))
                                                ) : (
                                                    <div className="p-2 text-center text-gray-500 dark:text-gray-400">
                                                        No suggestions available
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <div className="mb-4 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700">
                                    <DateFilterComponent />
                                </div>
                                <div className="transform transition-all duration-500 ease-in-out">
                                    <div className="space-y-6 rounded-lg xl:border dark:border-gray-800">
                                        <Table>
                                            <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
                                                <TableRow>
                                                    <TableCell isHeader className="py-4 font-medium text-gray-500 dark:text-gray-300 px-2 border-r border-gray-200 dark:border-gray-700">Index</TableCell>
                                                    <TableCell isHeader className="py-7 font-medium text-gray-500 dark:text-gray-300 px-2 border-r border-gray-200 dark:border-gray-700">Name</TableCell>
                                                    <TableCell isHeader className="py-7 font-medium text-gray-500 dark:text-gray-300 px-2 border-r border-gray-200 dark:border-gray-700">Phone</TableCell>
                                                    <TableCell isHeader className="py-7 font-medium text-gray-500 dark:text-gray-300 px-2 border-r border-gray-200 dark:border-gray-700">Interview Date & Time</TableCell>
                                                    <TableCell isHeader className="py-7 font-medium text-gray-500 dark:text-gray-300 px-2 border-r border-gray-200 dark:border-gray-700">Remark</TableCell>
                                                    <TableCell isHeader className="py-7 font-medium text-gray-500 dark:text-gray-300 px-2 border-r border-gray-200 dark:border-gray-700">Resume</TableCell>
                                                    <TableCell isHeader className="py-7 font-medium text-gray-500 dark:text-gray-300 px-2 border-r border-gray-200 dark:border-gray-700">Actions</TableCell>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05] text-center">
                                                {currentItems.length > 0 ? (
                                                    currentItems.map((item, index) => (
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
                                                                {item.phonenumber}
                                                            </TableCell>
                                                            <TableCell className="py-3 px-2 border-r border-gray-200 dark:border-gray-700 dark:text-gray-200">
                                                                {formatDateTime(item.interviewdate)}
                                                            </TableCell>
                                                            <TableCell className="py-3 px-2 w-64 border-r border-gray-200 dark:border-gray-700 dark:text-gray-200">
                                                                {item.remark ? item.remark : '-'}
                                                            </TableCell>

                                                            <TableCell className="py-3 px-2 border-r border-gray-200 dark:border-gray-700 dark:text-gray-200">
                                                                {item.resume ? (
                                                                    <button
                                                                        onClick={() => window.open(`http://localhost:5005/images/hiringresume/${item.resume}`, '_blank')}
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
                                                                    >
                                                                        <FontAwesomeIcon icon={faEdit} className="text-lg" />
                                                                    </button>
                                                                    <button
                                                                        className="text-red-600 transform transition-all duration-200 hover:scale-110"
                                                                        onClick={() => handleDelete(item._id)}
                                                                    >
                                                                        <FontAwesomeIcon icon={faTrash} className="text-lg" />
                                                                    </button>
                                                                </div>
                                                            </TableCell>
                                                        </TableRow>
                                                    ))
                                                ) : (
                                                    <tr>
                                                        <td colSpan={8} className="text-center pt-5 pb-4 dark:text-gray-200">
                                                            No candidates found for {selectedPosition}
                                                        </td>
                                                    </tr>
                                                )}
                                            </TableBody>
                                        </Table>
                                    </div>
                                </div>
                            </>
                        )}
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
                        <div className="px-6 py-4 border-b">
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
                                            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white ${errors.interviewdate ? 'border-red-500' : 'border-gray-300'
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
                                            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white ${errors.interviewtime ? 'border-red-500' : 'border-gray-300'
                                                }`}
                                            disabled={isSubmitting}
                                        />
                                        {errors.interviewtime && (
                                            <p className="text-red-500 text-sm mt-1">{errors.interviewtime}</p>
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
                                            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white ${errors.remark ? 'border-red-500' : 'border-gray-300'
                                                }`}
                                            placeholder="Enter remark"
                                            disabled={isSubmitting}
                                        />
                                    </div>

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
                                                                Drop file here
                                                            </span>
                                                        ) : (
                                                            <>
                                                                <span className="text-gray-500">Drag & drop resume or</span>
                                                                <span className="text-purple-600 font-medium dark:text-gray-400">
                                                                    Browse files
                                                                </span>
                                                            </>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* ✅ Show selected file name */}
                                            {selectedFileName && (
                                                <p className="text-sm text-gray-600 mt-2 truncate">
                                                    Selected file: <span className="font-medium">{selectedFileName}</span>
                                                </p>
                                            )}

                                            {/* ✅ Show error if exists */}
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

            <ToastContainer position="top-center" className="!z-[99999]" />
        </div>
    );
};

export default HiringResume;