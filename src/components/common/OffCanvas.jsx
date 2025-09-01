import { faXmark } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useEffect, useState } from 'react';
import axios from "axios";
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const OffCanvas = ({ name, onClose }) => {

    const [CoverImage, setCoverImage] = useState([]);
    const [loading, setLoading] = useState(true);

    const getCoverImage = (name) => {
        axios.post('http://localhost:5005/api/cover/tagName/find', { name }) // Send name in request body
            .then((res) => {
                setCoverImage(res.data.data);
                setLoading(false);
            })
            .catch((err) => {
                console.error(err);
                toast.error("Failed to fetch CoverImage.");
                setLoading(false);
            });
    };



    // Initial fetch
    useEffect(() => {
        getCoverImage(name);
    }, []);


    return (
        <>
            <div className='flex items-center justify-between px-3 py-5 sticky top-0 bg-white shadow dark:bg-white/[0.03]'>
                <p className='text-[25px]'>Cover Image</p>
                <button
                    className=""
                    onClick={() => onClose()}
                >
                    <FontAwesomeIcon icon={faXmark} className='text-[30px] font-extralight text-gray-500 dark:text-white' />
                </button>
            </div>

            <div className='p-5 gap-4'>
                {loading ? (
                    // Spinner while loading
                    <div className="flex justify-center items-center h-32">
                        <div className="w-10 h-10 border-4 border-gray-300 border-t-gray-900 rounded-full animate-spin"></div>
                    </div>
                ) : (
                    CoverImage.map((cover, coverIndex) => (
                        <div key={coverIndex} className='items-start justify-start gap-3 py-5 border-b grid grid-cols-12'>
                            {/* Image - 3 columns */}
                            <img src={cover.CoverURL} className="w-24 h-24 rounded-lg object-cover col-span-3" alt="Cover" />

                            {/* Content - 9 columns */}
                            <div className="col-span-9">
                                <p className='text-lg font-bold pb-2'>{cover.CoverName}</p>
                                <div className='flex flex-wrap gap-2'>
                                    {cover.TagName?.map((tag, tagIndex) => (
                                        <span key={tagIndex} className="mr-2 px-2 py-1 bg-gray-100 rounded text-md dark:bg-white/[0.03] border dark:border-gray-400">
                                            {tag}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>



        </>
    );
};

export default OffCanvas;
