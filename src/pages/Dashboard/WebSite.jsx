import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faAward, faPersonCirclePlus, faUser } from '@fortawesome/free-solid-svg-icons';
import { useNavigate } from 'react-router-dom';
import PageBreadcrumb from '../../components/common/PageBreadCrumb';

const DashWeb = () => {
    const [data, setData] = useState([]);
    const [data2, setData2] = useState([]);
    const [data3, setData3] = useState([]);
    const [loading, setLoading] = useState(true);

    const [isOn, setIsOn] = useState(false);
    const [adminId, setAdminId] = useState("");

    const navigate = useNavigate();

    const getData = () => {
        setLoading(true);
        axios.get('http://localhost:5004/api/plexus/portfolio/read')
            .then((res) => {
                setData(res.data.data);
                setLoading(false);
            })
            .catch(() => {
                setLoading(false);
                toast.error("Portfolio data not found");
            });
    };

    const getData2 = () => {
        setLoading(true);
        axios.post('http://localhost:5004/api/plexus/culture/read')
            .then((res) => {
                const sortedData = res.data.data.sort((a, b) => new Date(b.dateOfHiring) - new Date(a.dateOfHiring));
                setData2(sortedData);
                setLoading(false);
            })
            .catch(() => {
                setLoading(false);
                toast.error("Culture data not found");
            });
    };

    const getData3 = () => {
        setLoading(true);
        axios.get('http://localhost:5004/api/plexus/position/read')
            .then((res) => {
                const filteredData = res.data.data.filter(item => item.status === true);
                setData3(filteredData);
                setLoading(false);
            })
            .catch(() => {
                setLoading(false);
                // toast.error("Position data not found");
            });
    };

    const getAdminData = () => {
        axios.get('http://localhost:5004/api/plexus/admin/read')
            .then((res) => {
                setIsOn(res.data.data[0]?.hiringStatus === true || res.data.data[0]?.hiringStatus === "true");
                setAdminId(res.data.data[0]?._id);
            })
            .catch(() => {
                toast.error("Failed to fetch admin data.");
            });
    };

    const handleToggle = async () => {
        const newState = !isOn;
        setIsOn(newState);

        try {
            const response = await axios.patch(`http://localhost:5004/api/plexus/admin/update/${adminId}`, { hiringStatus: newState });
            toast.success(response.data.message);
            getAdminData();
        } catch (error) {
            console.error(error);
            toast.error("Failed to update hiring status.");
            setIsOn(!newState);
        }
    };

    useEffect(() => {
        getData();
        getData2();
        getData3();
        getAdminData();
    }, []);

    const handleShareClick = () => navigate("/website/portfolio");
    const handleShareClick2 = () => navigate("/website/culture");
    const handleShareClick3 = () => navigate("/website/position");

    if (loading) {
        return (
            <div className="h-[80vh] flex items-center justify-center">
                <div className="border p-4 flex items-center space-x-2 rounded-md">
                    <div className="w-10 h-10 border-2 border-gray-300 rounded-full animate-spin dark:border-gray-800" style={{ borderTop: "2px solid #0777AB" }}></div>
                </div>
            </div>
        );
    }

    return (
        <div>
            <PageBreadcrumb pageTitle="Website Dashboard" />

            

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

                <div onClick={handleShareClick3} className="bg-white dark:bg-[#1F2635] rounded-xl shadow-lg p-6 border-l-4 border-green-500 hover:shadow-xl transition-shadow duration-300 cursor-pointer">
                    <div className="flex items-center">
                        <div className="p-2 bg-white rounded-lg shadow-md mr-4 w-12 h-12 flex items-center justify-center">
                            <FontAwesomeIcon icon={faPersonCirclePlus} className="text-green-500 text-xl" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Open Positions</p>
                            <p className="text-3xl font-bold text-gray-900 dark:text-white">{data3.length}</p>
                        </div>
                    </div>
                </div>

                <div onClick={handleShareClick} className="bg-white dark:bg-[#1F2635] rounded-xl shadow-lg p-6 border-l-4 border-blue-500 hover:shadow-xl transition-shadow duration-300 cursor-pointer">
                    <div className="flex items-center">
                        <div className="p-2 bg-white rounded-lg shadow-md mr-4 w-12 h-12 flex items-center justify-center">
                            <FontAwesomeIcon icon={faAward} className="text-blue-500 text-xl" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Total Portfolio</p>
                            <p className="text-3xl font-bold text-gray-900 dark:text-white">{data.length}</p>
                        </div>
                    </div>
                </div>

                <div onClick={handleShareClick2} className="bg-white dark:bg-[#1F2635] rounded-xl shadow-lg p-6 border-l-4 border-purple-500 hover:shadow-xl transition-shadow duration-300 cursor-pointer">
                    <div className="flex items-center">
                        <div className="p-2 bg-white rounded-lg shadow-md mr-4 w-12 h-12 flex items-center justify-center">
                            <FontAwesomeIcon icon={faUser} className="text-purple-500 text-xl" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Total Culture</p>
                            <p className="text-3xl font-bold text-gray-900 dark:text-white">{data2.length}</p>
                        </div>
                    </div>
                </div>

            </div>

            <div className="flex items-center justify-between my-10 px-3">
                <h4 className="text-xl font-semibold">Hiring Status</h4>
                <div className="flex items-center space-x-3">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{isOn ? 'Active' : 'Inactive'}</span>
                    <button
                        onClick={handleToggle}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-300 focus:outline-none ${isOn ? 'bg-green-500' : 'bg-gray-300'}`}
                    >
                        <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-300 ${isOn ? 'translate-x-6' : 'translate-x-1'}`}
                        />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default DashWeb;
