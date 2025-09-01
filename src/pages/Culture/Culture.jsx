import React, { useEffect, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowUpFromBracket, faEdit, faPlus, faTrash } from '@fortawesome/free-solid-svg-icons';
import axios from 'axios';
import { toast, ToastContainer } from 'react-toastify';
import { Table, TableBody, TableCell, TableHeader, TableRow } from "../../components/ui/table";
import 'react-toastify/dist/ReactToastify.css';
import PageBreadcrumb from '../../components/common/PageBreadCrumb';
import CustomPagination from '../../components/common/pagination';

const Culture = () => {
    const [visible, setVisible] = useState(false);
    const [data, setData] = useState([]);
    const [id, setId] = useState();
    const [loading, setLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [selectedFileNames, setSelectedFileNames] = useState([]);
    const [imageFileLabel, setImageFileLabel] = useState('Image Upload');
    const [images, setImages] = useState([]);
    const [imagePreview, setImagePreview] = useState([]);
    const [existingImages, setExistingImages] = useState([]);
    const [errors, setErrors] = useState({});
    const [type, setType] = useState('image'); // Default type is image
    const [videoUrl, setVideoUrl] = useState(''); // State for video URL
    const [activeVideoIndex, setActiveVideoIndex] = useState(null); // Track which video is playing

    // Pagination states
    const [currentPage, setCurrentPage] = useState(1);
    const [totalItems, setTotalItems] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const itemsPerPage = 15; // Same as limit in API

    // Types for content
    const contentTypes = [
        { id: 'image', label: 'Image' },
        { id: 'video', label: 'Video URL' }
    ];

    const [originalState, setOriginalState] = useState({
        images: [],
        existingImages: [],
        selectedFileNames: [],
        imagePreview: [],
        type: 'image',
        videoUrl: ''
    });

    // Function to get YouTube video ID from URL
    const getYouTubeVideoId = (url) => {
        if (!url) return null;
        const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
        const match = url.match(regExp);
        return (match && match[2].length === 11) ? match[2] : null;
    };

    // Function to get YouTube embed URL from any YouTube URL format
    const getYouTubeEmbedUrl = (url) => {
        const videoId = getYouTubeVideoId(url);
        return videoId ? `https://www.youtube.com/embed/${videoId}` : '';
    };

    // Function to get YouTube thumbnail URL
    const getYouTubeThumbnail = (url) => {
        const videoId = getYouTubeVideoId(url);
        return videoId ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg` : null;
    };

    // Handle video play
    const handleVideoPlay = (index) => {
        // If another video is already playing, pause it
        if (activeVideoIndex !== null && activeVideoIndex !== index && document.getElementById(`video-frame-${activeVideoIndex}`)) {
            const activeIframe = document.getElementById(`video-frame-${activeVideoIndex}`);
            activeIframe.src = activeIframe.src.replace('?autoplay=1', '');
        }

        // Set the new active video and play it
        setActiveVideoIndex(index);

        // Get the iframe and set autoplay
        const iframe = document.getElementById(`video-frame-${index}`);
        if (iframe) {
            // Add autoplay parameter to URL if not already present
            if (!iframe.src.includes('autoplay=1')) {
                iframe.src = iframe.src.includes('?')
                    ? `${iframe.src}&autoplay=1`
                    : `${iframe.src}?autoplay=1`;
            }
        }
    };

    const resetForm = () => {
        setImages([]);
        setImagePreview([]);
        setExistingImages([]);
        setSelectedFileNames([]);
        setImageFileLabel('Image Upload');
        setId(undefined);
        setErrors({});
        setType('image');
        setVideoUrl('');
    };

    const toggleModal = (mode) => {
        if (!isSubmitting) {
            if (!visible) { // Opening modal
                if (mode === 'add') {
                    resetForm();
                }
            } else { // Closing modal
                // Restore original state if we were in edit mode
                if (id !== undefined) {
                    setImages(originalState.images);
                    setImagePreview(originalState.imagePreview);
                    setExistingImages(originalState.existingImages);
                    setSelectedFileNames(originalState.selectedFileNames);
                    setType(originalState.type);
                    setVideoUrl(originalState.videoUrl);
                } else {
                    resetForm();
                }
            }
            setVisible(!visible);
        }
    };

    const getData = (page = 1) => {
        setLoading(true);
        axios.post('https://api.pslink.world/api/plexus/culture/read', { page })
            .then((res) => {
                setData(res.data.data);
                setTotalItems(res.data.totalItems);
                setTotalPages(Math.ceil(res.data.totalItems / itemsPerPage));
                setLoading(false);
            })
            .catch((err) => {
                console.error(err);
                setLoading(false);
                toast.error(err.response?.data?.message || "Failed to fetch data.");
            });
    };

    useEffect(() => {
        getData(currentPage);
    }, [currentPage]);

    const handlePageChange = (newPage) => {
        if (newPage >= 1 && newPage <= totalPages) {
            setCurrentPage(newPage);
            // Reset active video when changing pages
            setActiveVideoIndex(null);
        }
    };

    const handleImageChange = (e) => {
        const files = Array.from(e.target.files);
        const totalImages = files.length + existingImages.length;

        if (totalImages > 5) {
            toast.error("Maximum 5 images allowed");
            return;
        }

        const newImages = [];
        const newPreviews = [];
        const newFileNames = [];

        files.forEach(file => {
            if (file.type.startsWith('image/')) {
                newImages.push(file);
                newPreviews.push(URL.createObjectURL(file));
                newFileNames.push(file.name);
            }
        });

        setImages([...images, ...newImages]);
        setImagePreview([...imagePreview, ...newPreviews]);
        setSelectedFileNames([...selectedFileNames, ...newFileNames]);
        setImageFileLabel(newFileNames.length > 0 ? 'Images Uploaded' : 'Image Upload');
    };

    const removeImage = (index, type) => {
        if (type === 'new') {
            const newImages = [...images];
            const newPreviews = [...imagePreview];
            newImages.splice(index, 1);
            newPreviews.splice(index, 1);
            setImages(newImages);
            setImagePreview(newPreviews);
        } else {
            const newExistingImages = [...existingImages];
            newExistingImages.splice(index, 1);
            setExistingImages(newExistingImages);
        }
    };

    // Validate YouTube URL
    const isValidYoutubeUrl = (url) => {
        const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.?be)\/.+$/;
        return youtubeRegex.test(url);
    };

    const validate = () => {
        const newErrors = {};

        if (type === 'image') {
            if (images.length === 0 && existingImages.length === 0) {
                newErrors.images = 'At least one image is required';
            }
        } else if (type === 'video') {
            if (!videoUrl.trim()) {
                newErrors.videoUrl = 'Video URL is required';
            } else if (!isValidYoutubeUrl(videoUrl)) {
                newErrors.videoUrl = 'Please enter a valid YouTube URL';
            }
        } else {
            newErrors.type = 'Please select a content type';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validate()) return;

        try {
            setIsSubmitting(true);
            const formData = new FormData();

            // Add type to formData
            formData.append('type', type);

            if (type === 'image') {
                images.forEach(image => {
                    formData.append('images', image);
                });
                formData.append('existingImages', JSON.stringify(existingImages));
            } else if (type === 'video') {
                // Ensure we're sending a proper embed URL
                console.log("enter");
                const embedUrl = getYouTubeEmbedUrl(videoUrl);
                formData.append('videoUrl', videoUrl);
            }

            const config = {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            };

            const request = id !== undefined
                ? axios.patch(`https://api.pslink.world/api/plexus/culture/update/${id}`, formData, config)
                : axios.post('https://api.pslink.world/api/plexus/culture/create', formData, config);

            const res = await request;
            resetForm();
            getData(currentPage);
            toast.success(res.data.message);
            toggleModal('add');
        } catch (err) {
            console.error(err);
            toast.error("An error occurred. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleEdit = (item) => {
        if (!isSubmitting) {
            // Store original state
            const newOriginalState = {
                images: [],
                existingImages: item.images || [],
                selectedFileNames: [],
                imagePreview: [],
                type: item.type || 'image',
                videoUrl: item.videoUrl || ''
            };
            setOriginalState(newOriginalState);

            // Set current state
            setExistingImages(item.images || []);
            setImages([]);
            setImagePreview([]);
            setSelectedFileNames([]);
            setType(item.type || 'image');
            setVideoUrl(item.videoUrl || '');
            setId(item._id);
            setVisible(true);
        }
    };

    const handleDelete = async (itemId) => {
        if (!isSubmitting && window.confirm("Are you sure you want to delete this Culture Details?")) {
            try {
                setIsSubmitting(true);
                const res = await axios.delete(`https://api.pslink.world/api/plexus/culture/delete/${itemId}`);
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

            <PageBreadcrumb pageTitle="Culture" />

            <div className="bg-white rounded-2xl px-6 py-6 mt-4 dark:border-gray-800 dark:bg-white/[0.03]">
                <div className="flex justify-end py-1 pr-2">
                    <button
                        onClick={() => toggleModal('add')}
                        className="text-sm rounded-lg border-0 px-4 py-2 text-white font-medium disabled:opacity-50"
                        style={{ backgroundColor: "#0777AB" }}
                        disabled={isSubmitting}
                    >
                        <FontAwesomeIcon icon={faPlus} className="pr-2" /> Add Culture
                    </button>
                </div>

                <div className="overflow-x-auto pt-6 transform transition-all duration-500 ease-in-out">
                    <div className="space-y-6 rounded-lg xl:border dark:border-gray-800">
                        <Table>
                            <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
                                <TableRow>
                                    <TableCell isHeader className="py-4 px-2 font-medium text-gray-500 dark:text-gray-300 border-r border-gray-200 dark:border-gray-700">Index</TableCell>
                                    <TableCell isHeader className="py-4 px-2 font-medium text-gray-500 dark:text-gray-300 border-r border-gray-200 dark:border-gray-700">Type</TableCell>
                                    <TableCell isHeader className="py-4 px-2 font-medium text-gray-500 dark:text-gray-300 border-r border-gray-200 dark:border-gray-700">Content</TableCell>
                                    <TableCell isHeader className="py-4 px-2 font-medium text-gray-500 dark:text-gray-300">Actions</TableCell>
                                </TableRow>
                            </TableHeader>

                            <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05] text-center text-sm">
                                {data.map((item, index) => {
                                    const rowIndex = ((currentPage - 1) * itemsPerPage) + index;
                                    const isVideoPlaying = activeVideoIndex === rowIndex;
                                    const hasVideo = item.type === 'video' || (!item.type && !item.images);
                                    const thumbnailUrl = hasVideo ? getYouTubeThumbnail(item.videoUrl) : null;

                                    return (
                                        <TableRow
                                            key={item._id}
                                            className="transition-all duration-300 hover:bg-gray-50 dark:hover:bg-gray-800/50"
                                            style={{
                                                animationDelay: `${index * 50}ms`,
                                                animation: 'fadeInLeft 0.4s ease-out forwards'
                                            }}
                                        >
                                            <TableCell className="px-2 py-3 border-r border-gray-200 dark:border-gray-700 dark:text-gray-200">
                                                {rowIndex + 1}
                                            </TableCell>
                                            <TableCell className="px-2 py-3 border-r border-gray-200 dark:border-gray-700 dark:text-gray-200">
                                                {item.type || 'Image'}
                                            </TableCell>
                                            <TableCell className="px-2 py-3 border-r border-gray-200 dark:border-gray-700">
                                                {(!item.type || item.type === 'image') && item.images && item.images.length > 0 ? (
                                                    <div className="flex justify-center gap-3 flex-wrap">
                                                        {item.images.map((img, idx) => (
                                                            <img
                                                                key={idx}
                                                                src={img}
                                                                alt={`Culture ${idx + 1}`}
                                                                className="w-24 h-24 object-cover"
                                                            />
                                                        ))}
                                                    </div>
                                                ) : hasVideo ? (
                                                    <div className="bg-black mx-auto overflow-hidden w-72 h-28">
                                                        {isVideoPlaying ? (
                                                            <iframe
                                                                id={`video-frame-${rowIndex}`}
                                                                width="100%"
                                                                height="115"
                                                                src={`${getYouTubeEmbedUrl(item.videoUrl)}?enablejsapi=1&autoplay=1`}
                                                                title="YouTube video player"
                                                                frameBorder="0"
                                                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                                                                referrerPolicy="strict-origin-when-cross-origin"
                                                                allowFullScreen
                                                            ></iframe>
                                                        ) : (
                                                            <button
                                                                className="relative border-0 w-full h-28 cursor-pointer"
                                                                onClick={() => handleVideoPlay(rowIndex)}
                                                            >
                                                                {thumbnailUrl ? (
                                                                    <img
                                                                        src={thumbnailUrl}
                                                                        alt="Video thumbnail"
                                                                        className="w-full h-full object-cover"
                                                                    />
                                                                ) : (
                                                                    <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                                                                        <span>Click to play video</span>
                                                                    </div>
                                                                )}
                                                                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-10 h-10 bg-black bg-opacity-70 rounded-full flex justify-center items-center">
                                                                    <div className="w-0 h-0 border-t-2 border-b-2 border-l-4 border-transparent border-l-white ml-1"></div>
                                                                </div>
                                                            </button>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <span className="text-gray-500">No content available</span>
                                                )}
                                            </TableCell>
                                            <TableCell className="px-2 py-3 dark:text-gray-200">
                                                <div className="flex justify-center gap-3">
                                                    <button
                                                        className="text-[#0777AB] hover:scale-110 transition-transform"
                                                        onClick={() => handleEdit(item)}
                                                        disabled={isSubmitting}
                                                    >
                                                        <FontAwesomeIcon icon={faEdit} />
                                                    </button>
                                                    <button
                                                        className="text-red-600 hover:scale-110 transition-transform"
                                                        onClick={() => handleDelete(item._id)}
                                                        disabled={isSubmitting}
                                                    >
                                                        <FontAwesomeIcon icon={faTrash} />
                                                    </button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
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
                    <div className="bg-white rounded-lg max-w-lg w-full mx-4 max-h-90vh overflow-y-auto dark:bg-gray-800 dark:text-gray-200">
                        <div className="border-b px-6 py-4">
                            <h3 className="text-lg font-semibold">{id ? "Edit Culture" : "Add New Culture"}</h3>
                        </div>
                        <div className="px-6 py-4">
                            <form onSubmit={handleSubmit}>
                                {/* Content Type Selection */}
                                <div className="mb-3">
                                    <label className="block font-bold mb-2">
                                        Content Type
                                        <span className="text-red-500 font-normal text-lg">* </span>
                                    </label>
                                    <div className="flex gap-3">
                                        {contentTypes.map((contentType) => (
                                            <button
                                                key={contentType.id}
                                                onClick={() => !isSubmitting && setType(contentType.id)}
                                                className={`px-3 py-1 rounded-lg border ${type === contentType.id
                                                    ? 'text-white'
                                                    : 'bg-gray-100 text-gray-800'
                                                    } ${isSubmitting ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                                                style={{
                                                    backgroundColor: type === contentType.id ? "#0385C3" : ""
                                                }}
                                                disabled={isSubmitting}
                                                type="button"
                                            >
                                                {contentType.label}
                                            </button>
                                        ))}
                                    </div>
                                    {errors.type && (
                                        <div className="text-red-500 text-sm mt-1">
                                            {errors.type}
                                        </div>
                                    )}
                                </div>

                                {type === 'image' && (
                                    <>
                                        <div className="mb-3">
                                            <label className="block font-bold mb-2">
                                                {imageFileLabel}
                                                <span className="text-red-500 font-normal text-lg">* </span>
                                            </label>
                                            <div className="flex items-center">
                                                <input
                                                    type="file"
                                                    id="cultureImages"
                                                    multiple
                                                    accept="image/*"
                                                    onChange={handleImageChange}
                                                    className="hidden"
                                                    disabled={isSubmitting || (imagePreview.length + existingImages.length) >= 5}
                                                />
                                                <label
                                                    htmlFor="cultureImages"
                                                    className="block w-full p-4 bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white transition-all duration-200  rounded-lg border-2 border-dashed border-gray-300 text-center cursor-pointer hover:border-gray-400"
                                                >
                                                    <FontAwesomeIcon icon={faArrowUpFromBracket} className="text-sm" />
                                                    <div className="text-gray-400 pt-1">
                                                        Select Images (Max 5)
                                                    </div>
                                                    {selectedFileNames.length > 0 && (
                                                        <div className="mt-2">
                                                            {selectedFileNames.map((name, index) => (
                                                                <span
                                                                    key={index}
                                                                    className="block text-xs text-blue-500"
                                                                >
                                                                    {name}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    )}
                                                </label>
                                            </div>
                                            {errors.images && (
                                                <div className="text-red-500 text-sm mt-1">
                                                    {errors.images}
                                                </div>
                                            )}
                                            <small className="text-gray-500 block mt-1">Maximum 5 images allowed</small>
                                        </div>

                                        {/* Display existing images */}
                                        {existingImages.length > 0 && (
                                            <div className="mb-3">
                                                <label className="block font-bold mb-2">Existing Images:</label>
                                                <div className="flex flex-wrap gap-3">
                                                    {existingImages.map((img, index) => (
                                                        <div key={`existing-${index}`} className="relative">
                                                            <img
                                                                src={img}
                                                                alt={`Existing ${index + 1}`}
                                                                className="w-24 h-24 object-cover rounded"
                                                            />
                                                            <button
                                                                type="button"
                                                                className="absolute -top-2 -right-2 bg-red-700 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600 disabled:opacity-50"
                                                                onClick={() => removeImage(index, 'existing')}
                                                                disabled={isSubmitting}
                                                            >
                                                                <FontAwesomeIcon icon={faTrash} />
                                                            </button>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {/* Display new image previews */}
                                        {imagePreview.length > 0 && (
                                            <div className="mb-3">
                                                <label className="block font-bold mb-2">New Images:</label>
                                                <div className="flex flex-wrap gap-3">
                                                    {imagePreview.map((preview, index) => (
                                                        <div key={`new-${index}`} className="relative">
                                                            <img
                                                                src={preview}
                                                                alt={`Preview ${index + 1}`}
                                                                className="w-24 h-24 object-cover rounded"
                                                            />
                                                            <button
                                                                type="button"
                                                                className="absolute -top-2 -right-2 bg-red-700 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600 disabled:opacity-50"
                                                                onClick={() => {
                                                                    removeImage(index, 'new');
                                                                    const newFileNames = [...selectedFileNames];
                                                                    newFileNames.splice(index, 1);
                                                                    setSelectedFileNames(newFileNames);
                                                                    if (newFileNames.length === 0) {
                                                                        setImageFileLabel('Image Upload');
                                                                    }
                                                                }}
                                                                disabled={isSubmitting}
                                                            >
                                                                <FontAwesomeIcon icon={faTrash} />
                                                            </button>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </>
                                )}

                                {type === 'video' && (
                                    <div className="mb-3">
                                        <label className="block font-bold mb-2">
                                            YouTube Video URL
                                            <span className="text-red-500 font-normal text-lg">* </span>
                                        </label>
                                        <input
                                            type="text"
                                            placeholder="Enter YouTube URL (e.g., https://www.youtube.com/watch?v=xxxx)"
                                            value={videoUrl}
                                            onChange={(e) => setVideoUrl(e.target.value)}
                                            className={`w-full dark:bg-gray-700 dark:border-gray-600 dark:text-white transition-all duration-200 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.videoUrl ? 'border-red-500' : 'border-gray-300'
                                                }`}
                                            disabled={isSubmitting}
                                        />
                                        {errors.videoUrl && (
                                            <div className="text-red-500 text-sm mt-1">
                                                {errors.videoUrl}
                                            </div>
                                        )}
                                        <div className="text-gray-500 text-sm mt-1">
                                            Only YouTube URLs are supported (youtube.com or youtu.be)
                                        </div>

                                        {/* Preview section for video */}
                                        {videoUrl && isValidYoutubeUrl(videoUrl) && (
                                            <div className="mt-3">
                                                <label className="block font-bold mb-2">Video Preview:</label>
                                                <div className="flex justify-center">
                                                    <div className="bg-transparent w-80 h-44">
                                                        <iframe
                                                            width="100%"
                                                            height="100%"
                                                            src={getYouTubeEmbedUrl(videoUrl)}
                                                            title="YouTube video player"
                                                            frameBorder="0"
                                                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                                                            referrerPolicy="strict-origin-when-cross-origin"
                                                            allowFullScreen
                                                        ></iframe>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}

                                <div className="flex justify-end gap-3 pt-4">
                                    <button
                                        type="button"
                                        onClick={() => toggleModal('close')}
                                        className="px-6 py-2 border border-gray-300 rounded-lg text-gray-600 dark:bg-gray-700 dark:border-gray-600 dark:text-white transition-all duration-200 disabled:opacity-50"
                                        disabled={isSubmitting}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="px-6 py-2 text-white rounded-lg disabled:opacity-50"
                                        style={{ backgroundColor: "#0385C3" }}
                                        disabled={isSubmitting}
                                    >
                                        {isSubmitting ? (
                                            <span className="flex items-center">
                                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                                {id ? "Updating..." : "Adding..."}
                                            </span>
                                        ) : (
                                            id ? "Update Culture" : "Add Culture"
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

export default Culture;