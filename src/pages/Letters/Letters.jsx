import React, { useState } from "react";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faAward } from "@fortawesome/free-solid-svg-icons";
import jsPDF from "jspdf";
import "jspdf-autotable";


const Letters = () => {
    const [selectedLetter, setSelectedLetter] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [formData, setFormData] = useState({});

    const letterTypes = [
        {
            id: 'experience',
            title: 'Experience Letter',
            description: 'Professional work experience certificate',
            icon: <FontAwesomeIcon icon={faAward} className="w-5 h- text-white" />,
            color: 'bg-blue-500',
            fields: [
                { name: 'employeeName', label: 'Employee Name', type: 'text', required: true },
                { name: 'designation', label: 'Designation', type: 'text', required: true },
                { name: 'period', label: 'Period', type: 'text', required: true },
                { name: 'periodstartDate', label: 'Period Start Date', type: 'date', required: true },
                { name: 'periodendDate', label: 'Period End Date', type: 'date', required: true },
                { name: 'workstartDate', label: 'Work Start Date', type: 'date', required: true },
                { name: 'workendDate', label: 'Work End Date', type: 'date', required: true },
            ]
        },
        {
            id: 'Internship',
            title: 'Internship Letter',
            description: 'Professional work experience certificate',
            icon: <FontAwesomeIcon icon={faAward} className="w-5 h- text-white" />,
            color: 'bg-blue-500',
            fields: [
                { name: 'employeeName', label: 'Employee Name', type: 'text', required: true },
                { name: 'designation', label: 'Designation', type: 'text', required: true },
                { name: 'period', label: 'Period', type: 'text', required: true },
                { name: 'periodstartDate', label: 'Period Start Date', type: 'date', required: true },
                { name: 'periodendDate', label: 'Period End Date', type: 'date', required: true },
                { name: 'workstartDate', label: 'Work Start Date', type: 'date', required: true },
                { name: 'workendDate', label: 'Work End Date', type: 'date', required: true },
            ]
        }
    ];

    const handleLetterClick = (letter) => {
        setSelectedLetter(letter);
        setFormData({});
        setShowModal(true);
    };

    const handleInputChange = (fieldName, value) => {
        setFormData(prev => ({
            ...prev,
            [fieldName]: value
        }));
    };

    const getBase64FromUrl = async (url) => {
        const response = await fetch(url);
        const blob = await response.blob();
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        });
    };

    const getBase64FromUrl2 = async (url) => {
        const response = await fetch(url);
        const blob = await response.blob();
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(blob);
            reader.onloadend = () => {
                const base64data = reader.result.split(',')[1]; // Extract pure base64
                resolve(base64data);
            };
            reader.onerror = reject;
        });
    };


    const generatePDF = async () => {
        const {
            employeeName,
            designation,
            period,
            periodstartDate,
            periodendDate,
            workstartDate,
            workendDate
        } = formData;

        const doc = new jsPDF({
            orientation: "portrait",
            unit: "mm",
            format: "a4"
        });

        try {
            // Add Myriad Pro font
            const fontBase64 = await getBase64FromUrl2(`http://localhost:3000/MYRIADPRO-REGULAR.ttf`);
            doc.addFileToVFS('MYRIADPRO-REGULAR.ttf', fontBase64);
            doc.addFont('MYRIADPRO-REGULAR.ttf', 'MyriadPro', 'normal');

            const boldFontBase64 = await getBase64FromUrl2(`http://localhost:3000/MYRIADPRO-BOLD.ttf`);
            doc.addFileToVFS('MYRIADPRO-BOLD.ttf', boldFontBase64);
            doc.addFont('MYRIADPRO-BOLD.ttf', 'MyriadPro', 'bold');



            // Set default font
            doc.setFont("MyriadPro");

            const bgBase64 = await getBase64FromUrl(`http://localhost:3000/background.png`);
            doc.addImage(bgBase64, 'PNG', 0, 0, 210, 297);

            doc.setFontSize(14);
            doc.setFont("MyriadPro", "normal");
            doc.text(`${new Date().toLocaleDateString()}`, 188, 39.5, { align: "center" });

            doc.setFontSize(12);
            let y = 80;

            // Subject - Bold
            doc.setFontSize(14);
            doc.setFont("MyriadPro", "bold");
            doc.text(`Subject: Experience Of ${designation} at Plexus Technology.`, 18, y);
            y += 15;

            doc.setFontSize(14);
            doc.setFont("MyriadPro", "bold");
            doc.text(`Dear ${employeeName},`, 18, y);
            y += 15;

            // ----- Paragraph 1 with automatic line breaks -----
            doc.setFont("MyriadPro", "normal");

            // Create the complete paragraph text
            const paragraph1 = `This is to Certify that ${employeeName} was working with Plexus Technology Surat, Gujarat India as ${designation} from ${periodstartDate} to ${periodendDate} as a ${period} Period and ${workstartDate} to ${workendDate} as a Full-time Employee per the personnel roles and company's employment record.`;

            // Split text to fit within page width (170mm width to leave margins)
            const splitParagraph1 = doc.splitTextToSize(paragraph1, 170);

            // Process each line to apply bold formatting to specific words
            splitParagraph1.forEach(line => {
                let currentX = 18;

                // Split the line into words to check for bold formatting
                const words = line.split(' ');
                const boldWords = [employeeName, designation, periodstartDate, periodendDate, period, workstartDate, workendDate];

                for (let i = 0; i < words.length; i++) {
                    const word = words[i];
                    const isLastWord = i === words.length - 1;
                    const wordWithSpace = isLastWord ? word : word + ' ';

                    // Check if this word should be bold
                    const shouldBeBold = boldWords.some(boldWord => word.includes(boldWord.replace(/,/g, '')));

                    if (shouldBeBold) {
                        doc.setFont("MyriadPro", "bold");
                    } else {
                        doc.setFont("MyriadPro", "normal");
                    }

                    doc.text(wordWithSpace, currentX, y);
                    currentX += doc.getTextWidth(wordWithSpace);
                }

                y += 7; // Move to next line
            });

            y += 5; // Add some space after paragraph 1

            // ----- Paragraph 2 -----
            doc.setFont("MyriadPro", "normal");
            const para2 = `During his employment, we found ${employeeName} to be a professional, knowledgeable and result-oriented with theoretical and practical understanding of work requirements.`;

            const splitPara2 = doc.splitTextToSize(para2, 170);
            let para2Y = y;
            splitPara2.forEach(line => {
                const nameIndex = line.indexOf(employeeName);
                if (nameIndex !== -1) {
                    const beforeName = line.substring(0, nameIndex);
                    const afterName = line.substring(nameIndex + employeeName.length);
                    let xLine = 18;

                    doc.setFont("MyriadPro", "normal");
                    doc.text(beforeName, xLine, para2Y);
                    xLine += doc.getTextWidth(beforeName);

                    doc.setFont("MyriadPro", "bold");
                    doc.text(employeeName, xLine, para2Y);
                    xLine += doc.getTextWidth(employeeName);

                    doc.setFont("MyriadPro", "normal");
                    doc.text(afterName, xLine, para2Y);
                } else {
                    doc.setFont("MyriadPro", "normal");
                    doc.text(line, 18, para2Y);
                }
                para2Y += 7;
            });
            y = para2Y + 5;

            // ----- Paragraph 3 -----
            doc.setFont("MyriadPro", "normal");
            const para3 = `He has a friendly, outgoing personality, very good sense of humour and works well as an individual or member of a team as required by the management. The only one reason for his removal from the company is that he took too many Leaves.`;
            const splitPara3 = doc.splitTextToSize(para3, 170);
            splitPara3.forEach(line => {
                doc.text(line, 18, y);
                y += 7;
            });

            y += 10;

            // Signature
            doc.setFontSize(12);
            doc.setFont("MyriadPro", "bold");
            doc.text(`${employeeName}`, 153, y += 47);

            doc.save("Experience-Letter.pdf");
        } catch (error) {
            console.error("Error loading background image or font:", error);
        }
    };


    const closeModal = () => {
        setShowModal(false);
        setSelectedLetter(null);
        setFormData({});
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <PageBreadcrumb pageTitle="Letters Management" />

            {/* Letter Types Grid */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                    {letterTypes.map((letter) => {
                        return (
                            <div
                                key={letter.id}
                                onClick={() => handleLetterClick(letter)}
                                className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer transform hover:-translate-y-2 border border-gray-100"
                            >
                                <div className="p-6">
                                    <div className={`${letter.color} w-12 h-12 rounded-lg flex items-center justify-center mb-4`}>
                                        {letter.icon}
                                    </div>
                                    <h3 className="text-xl font-bold text-gray-900 mb-2">{letter.title}</h3>
                                    <p className="text-gray-600 text-sm leading-relaxed">{letter.description}</p>
                                    <div className="mt-4 flex items-center text-blue-600 font-medium">
                                        <span>Create Letter</span>
                                        <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                                        </svg>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Modal */}
            {showModal && selectedLetter && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-99999">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
                        {/* Modal Header */}
                        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4 flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                                <div className="bg-white bg-opacity-20 p-2 rounded-lg">
                                    {selectedLetter.icon}
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold text-white">{selectedLetter.title}</h2>
                                    <p className="text-blue-100 text-sm">{selectedLetter.description}</p>
                                </div>
                            </div>
                            <button
                                onClick={closeModal}
                                className="text-white hover:bg-white hover:bg-opacity-20 p-2 rounded-lg transition-colors"
                            >
                                {/* <X className="w-5 h-5" /> */}
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {selectedLetter.fields.map((field) => (
                                    <div key={field.name} className={field.type === 'textarea' ? 'md:col-span-2' : ''}>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            {field.label}
                                            {field.required && <span className="text-red-500 ml-1">*</span>}
                                        </label>
                                        {field.type === 'textarea' ? (
                                            <textarea
                                                value={formData[field.name] || ''}
                                                onChange={(e) => handleInputChange(field.name, e.target.value)}
                                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                                rows="3"
                                                placeholder={`Enter ${field.label.toLowerCase()}`}
                                            />
                                        ) : (
                                            <input
                                                type={field.type}
                                                value={formData[field.name] || ''}
                                                onChange={(e) => handleInputChange(field.name, e.target.value)}
                                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                                placeholder={field.type === 'date' ? '' : `Enter ${field.label.toLowerCase()}`}
                                            />
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Modal Footer */}
                        <div className="bg-gray-50 px-6 py-4 flex justify-end space-x-3">
                            <button
                                onClick={closeModal}
                                className="px-6 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={generatePDF}
                                className="px-6 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all flex items-center space-x-2"
                            >
                                <span>Generate PDF</span>
                            </button>

                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Letters;