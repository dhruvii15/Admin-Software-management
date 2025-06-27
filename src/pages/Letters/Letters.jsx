import React, { useState } from "react";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
    faBriefcase,
    faFileSignature,
    faUserGraduate,
    faCertificate,
} from '@fortawesome/free-solid-svg-icons';
import jsPDF from "jspdf";
import "jspdf-autotable";


const Letters = () => {
    const [selectedLetter, setSelectedLetter] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [formData, setFormData] = useState({});
    const [errors, setErrors] = useState({});
    const [formattedData, setFormattedData] = useState({});

    // Add this validation function
    const validateForm = () => {
        const newErrors = {};
        const requiredFields = selectedLetter.fields.filter(field => field.required);

        requiredFields.forEach(field => {
            if (!formData[field.name] || formData[field.name].trim() === '') {
                newErrors[field.name] = `${field.label} is required`;
            }
        });

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const letterTypes = [
        {
            id: 'experience',
            title: 'Experience Letter',
            description: 'Professional work experience certificate',
            icon: <FontAwesomeIcon icon={faBriefcase} className="w-5 h-5 text-white" />,
            color: 'bg-blue-600',
            fields: [
                { name: 'employeeName', label: 'Employee Name', type: 'text', required: true },
                { name: 'designation', label: 'Designation', type: 'text', required: true },
                {
                    name: 'period',
                    label: 'Period',
                    type: 'select',
                    required: true,
                    options: [
                        { label: 'Probation', value: 'Probation Period' },
                        { label: 'Training', value: 'Training Period' }
                    ]
                },
                { name: 'periodstartDate', label: 'Period Start Date', type: 'date', required: true },
                { name: 'periodendDate', label: 'Period End Date', type: 'date', required: true },
                { name: 'workstartDate', label: 'Work Start Date', type: 'date', required: true },
                { name: 'workendDate', label: 'Work End Date', type: 'date', required: true },
            ]
        },
        {
            id: 'offer',
            title: 'Offer Letter',
            description: 'Official offer with joining details',
            icon: <FontAwesomeIcon icon={faFileSignature} className="w-5 h-5 text-white" />,
            color: 'bg-purple-600',
            fields: [
                { name: 'employeeName', label: 'Employee Name', type: 'text', required: true },
                { name: 'designation', label: 'Designation', type: 'text', required: true },
                { name: 'salary', label: 'Salary', type: 'text', required: true },
                { name: 'startdate', label: 'Join Date', type: 'date', required: true },
                { name: 'enddate', label: 'End Date', type: 'date', required: true },
            ]
        },
        {
            id: 'internship',
            title: 'Internship Offer Letter',
            description: 'Letter offering internship opportunity',
            icon: <FontAwesomeIcon icon={faUserGraduate} className="w-5 h-5 text-white" />,
            color: 'bg-yellow-600',
            fields: [
                { name: 'employeeName', label: 'Intern Name', type: 'text', required: true },
                { name: 'designation', label: 'Designation', type: 'text', required: true },
                { name: 'collegename', label: 'College Name', type: 'text', required: true },
                { name: 'startdate', label: 'Internship Start Date', type: 'date', required: true },
            ]
        },
        {
            id: 'internship certificate',
            title: 'Internship Certificate',
            description: 'Certificate for completed internship',
            icon: <FontAwesomeIcon icon={faCertificate} className="w-5 h-5 text-white" />,
            color: 'bg-teal-600',
            fields: [
                { name: 'employeeName', label: 'Intern Name', type: 'text', required: true },
                { name: 'designation', label: 'Designation', type: 'text', required: true },
                { name: 'collegename', label: 'College Name', type: 'text', required: true },
                { name: 'startdate', label: 'Internship Start Date', type: 'date', required: true },
                { name: 'enddate', label: 'Internship End Date', type: 'date', required: true },
            ]
        }
    ];


    const handleLetterClick = (letter) => {
        setSelectedLetter(letter);
        setFormData({});
        setShowModal(true);
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
            workendDate,
            companyname = "Plexus Technology Surat, Gujarat"
        } = formData;

        const formattedperiodstartDate = formatDate(periodstartDate);
        const formattedperiodendDate = formatDate(periodendDate);
        const formattedworkstartDate = formatDate(workstartDate);
        const formattedworkendDate = formatDate(workendDate);

        const doc = new jsPDF({
            orientation: "portrait",
            unit: "mm",
            format: "a4"
        });

        try {
            // Add Myriad Pro font
            const fontBase64 = await getBase64FromUrl2(`https://admin-software-management.vercel.app/MYRIADPRO-REGULAR.ttf`);
            doc.addFileToVFS('MYRIADPRO-REGULAR.ttf', fontBase64);
            doc.addFont('MYRIADPRO-REGULAR.ttf', 'MyriadPro', 'normal');

            const boldFontBase64 = await getBase64FromUrl2(`https://admin-software-management.vercel.app/MYRIADPRO-BOLD.ttf`);
            doc.addFileToVFS('MYRIADPRO-BOLD.ttf', boldFontBase64);
            doc.addFont('MYRIADPRO-BOLD.ttf', 'MyriadPro', 'bold');

            // Set default font
            doc.setFont("MyriadPro");

            const bgBase64 = await getBase64FromUrl(`https://admin-software-management.vercel.app/experienceletter.png`);
            doc.addImage(bgBase64, 'PNG', 0, 0, 210, 297);

            doc.setFontSize(14);
            doc.setFont("MyriadPro", "normal");
            doc.text(`${formatDate(new Date())}`, 189, 36.5, { align: "center" });

            doc.setFontSize(12);
            let y = 80;

            // Subject - Bold
            doc.setFontSize(15);
            doc.setFont("MyriadPro", "bold");
            doc.text(`Subject: `, 18, y);
            doc.setFont("MyriadPro", "normal");
            doc.text(`Experience Of ${designation} at Plexus Technology.`, 38, y);
            y += 15;

            doc.setFontSize(14);
            doc.setFont("MyriadPro", "bold");
            doc.text(`Dear ${employeeName},`, 18, y);
            y += 15;

            // ----- Paragraph 1 with automatic line breaks -----
            doc.setFont("MyriadPro", "normal");

            // Create the complete paragraph text
            const paragraph1 = `This is to Certify that ${employeeName} was working with ${companyname} India as ${designation} from ${formattedperiodstartDate} to ${formattedperiodendDate} as a ${period} and ${formattedworkstartDate} to ${formattedworkendDate} as a Full-time Employee per the personnel roles and company's employment record.`;

            // Split text for width
            const splitParagraph1 = doc.splitTextToSize(paragraph1, 170);

            // Bold phrases to check
            const boldPhrases = [employeeName, companyname, designation, formattedperiodstartDate, formattedperiodendDate, period, formattedworkstartDate, formattedworkendDate, "Full-time Employee"];

            splitParagraph1.forEach(line => {
                let currentX = 18;
                let remainingLine = line;

                while (remainingLine.length > 0) {
                    // Find which bold phrase comes first in the line
                    let firstBoldIndex = -1;
                    let foundBold = '';

                    boldPhrases.forEach(phrase => {
                        const index = remainingLine.indexOf(phrase);
                        if (index !== -1 && (firstBoldIndex === -1 || index < firstBoldIndex)) {
                            firstBoldIndex = index;
                            foundBold = phrase;
                        }
                    });

                    if (firstBoldIndex === -1) {
                        // No bold phrase found, print remaining normal text
                        doc.setFont("MyriadPro", "normal");
                        doc.text(remainingLine, currentX, y);
                        currentX += doc.getTextWidth(remainingLine);
                        remainingLine = '';
                    } else {
                        // Print normal text before bold phrase
                        const normalText = remainingLine.substring(0, firstBoldIndex);
                        if (normalText) {
                            doc.setFont("MyriadPro", "normal");
                            doc.text(normalText, currentX, y);
                            currentX += doc.getTextWidth(normalText);
                        }

                        // Print bold phrase
                        doc.setFont("MyriadPro", "bold");
                        doc.text(foundBold, currentX, y);
                        currentX += doc.getTextWidth(foundBold);

                        // Update remaining line
                        remainingLine = remainingLine.substring(firstBoldIndex + foundBold.length);
                    }
                }

                y += 7; // Next line
            });

            y += 5; // Space after paragraph


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

    const generatePDFInternship = async () => {
        const {
            employeeName,
            designation,
            collegename,
            companyname = "Plexus Technology",
            city = "Surat",
            startdate
        } = formData;

        const doc = new jsPDF({
            orientation: "portrait",
            unit: "mm",
            format: "a4"
        });

        const formattedstartdate = formatDate(startdate);
        try {
            // Add Myriad Pro font
            const fontBase64 = await getBase64FromUrl2(`https://admin-software-management.vercel.app/MYRIADPRO-REGULAR.ttf`);
            doc.addFileToVFS('MYRIADPRO-REGULAR.ttf', fontBase64);
            doc.addFont('MYRIADPRO-REGULAR.ttf', 'MyriadPro', 'normal');

            const boldFontBase64 = await getBase64FromUrl2(`https://admin-software-management.vercel.app/MYRIADPRO-BOLD.ttf`);
            doc.addFileToVFS('MYRIADPRO-BOLD.ttf', boldFontBase64);
            doc.addFont('MYRIADPRO-BOLD.ttf', 'MyriadPro', 'bold');

            // Set default font
            doc.setFont("MyriadPro");

            const bgBase64 = await getBase64FromUrl(`https://admin-software-management.vercel.app/internshipoffer.png`);
            doc.addImage(bgBase64, 'PNG', 0, 0, 210, 297);

            doc.setFontSize(14);
            doc.setFont("MyriadPro", "normal");
            doc.text(`${formatDate(new Date())}`, 188, 36.5, { align: "center" });

            doc.setFontSize(12);
            let y = 100;

            // Subject - Bold (Modified for Internship)
            doc.setFontSize(14);
            doc.setFont("MyriadPro", "bold");
            doc.text(`Dear , ${employeeName}`, 18, y);
            y += 10;

            doc.setFontSize(13);
            doc.setFont("MyriadPro", "normal");
            doc.text(`${collegename},`, 18, y);
            y += 10;

            // ----- Paragraph 1 with automatic line breaks (Modified for Internship) -----
            doc.setFont("MyriadPro", "normal");

            // Create the complete paragraph text for internship
            const paragraph1 = `In Reference to your application,we would like congratulate you on being selected for an internship with ${companyname} from ${city} . Your training is scheduled to start on ${formattedstartdate}. All of us at ${companyname} are excited that you will be joining our team.`;

            // Split text to fit within page width (170mm width to leave margins)
            const splitParagraph1 = doc.splitTextToSize(paragraph1, 170);

            // Process each line to apply bold formatting to specific words
            splitParagraph1.forEach(line => {
                let currentX = 18;

                // Split the line into words to check for bold formatting
                const words = line.split(' ');
                const boldWords = [employeeName, companyname, city, formattedstartdate, collegename];

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

                y += 8; // Move to next line
            });

            y += 5; // Add some space after paragraph 1

            // ----- Paragraph 2 (Modified for Internship) -----
            doc.setFont("MyriadPro", "normal");
            const para2 = `In your internship, we will include training and focus on learning ${designation} and new skills and gaining a deeper understanding of concepts through hands-on ${designation} of the knowledge you learned Information about the project and technical platform will be shared with you before the commencement of your training Congratulations to you and we are excited to work with you.`;

            const splitPara2 = doc.splitTextToSize(para2, 170);
            let para2Y = y;
            splitPara2.forEach(line => {
                const nameIndex = line.indexOf(designation);
                if (nameIndex !== -1) {
                    const beforeName = line.substring(0, nameIndex);
                    const afterName = line.substring(nameIndex + designation.length);
                    let xLine = 18;

                    doc.setFont("MyriadPro", "normal");
                    doc.text(beforeName, xLine, para2Y);
                    xLine += doc.getTextWidth(beforeName);

                    doc.setFont("MyriadPro", "bold");
                    doc.text(designation, xLine, para2Y);
                    xLine += doc.getTextWidth(designation);

                    doc.setFont("MyriadPro", "normal");
                    doc.text(afterName, xLine, para2Y);
                } else {
                    doc.setFont("MyriadPro", "normal");
                    doc.text(line, 18, para2Y);
                }
                para2Y += 8;
            });
            y = para2Y + 5;

            doc.save("Internship-Offer-Letter.pdf");
        } catch (error) {
            console.error("Error loading background image or font:", error);
        }
    };

    const generatePDFInternship2 = async () => {
        const {
            employeeName,
            designation,
            collegename,
            companyname = "Plexus Technology",
            startdate,
            enddate,
        } = formData;

        const doc = new jsPDF({
            orientation: "portrait",
            unit: "mm",
            format: "a4"
        });

        const formattedstartdate = formatDate(startdate);
        const formattedenddate = formatDate(enddate);

        try {
            // Add Myriad Pro font
            const fontBase64 = await getBase64FromUrl2(`https://admin-software-management.vercel.app/MYRIADPRO-REGULAR.ttf`);
            doc.addFileToVFS('MYRIADPRO-REGULAR.ttf', fontBase64);
            doc.addFont('MYRIADPRO-REGULAR.ttf', 'MyriadPro', 'normal');

            const boldFontBase64 = await getBase64FromUrl2(`https://admin-software-management.vercel.app/MYRIADPRO-BOLD.ttf`);
            doc.addFileToVFS('MYRIADPRO-BOLD.ttf', boldFontBase64);
            doc.addFont('MYRIADPRO-BOLD.ttf', 'MyriadPro', 'bold');

            // Set default font
            doc.setFont("MyriadPro");

            const bgBase64 = await getBase64FromUrl(`https://admin-software-management.vercel.app/internshipcertificate.png`);
            doc.addImage(bgBase64, 'PNG', 0, 0, 210, 297);

            doc.setFontSize(14);
            doc.setFont("MyriadPro", "normal");
            doc.text(`${formatDate(new Date())}`, 188, 36.5, { align: "center" });

            doc.setFontSize(12);
            let y = 100;

            // Subject - Bold (Modified for Internship)
            doc.setFontSize(14);
            doc.setFont("MyriadPro", "bold");
            doc.text(`Dear , ${employeeName}`, 18, y);
            y += 10;

            doc.setFontSize(13);
            doc.setFont("MyriadPro", "normal");
            doc.text(`${collegename},`, 18, y);
            y += 10;

            // ----- Paragraph 1 with automatic line breaks (Modified for Internship) -----
            doc.setFont("MyriadPro", "normal");

            // Create the complete paragraph text for internship
            const paragraph1 = `This is to Certify that ${employeeName} has done Internship as a ${designation} we would like to Congratulate you on being Completed for an Internship with ${companyname} from Surat . Her training is scheduled on ${formattedstartdate} to ${formattedenddate}.`;

            // Split text to fit within page width (170mm width to leave margins)
            const splitParagraph1 = doc.splitTextToSize(paragraph1, 170);

            // Process each line to apply bold formatting to specific words
            splitParagraph1.forEach(line => {
                let currentX = 18;

                // Split the line into words to check for bold formatting
                const words = line.split(' ');
                const boldWords = [employeeName, designation, companyname, formattedstartdate, collegename, formattedenddate];

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

                y += 8; // Move to next line
            });

            y += 5; // Add some space after paragraph 1

            // ----- Paragraph 2 (Modified for Internship) -----
            doc.setFont("MyriadPro", "normal");
            const para2 = `During Internship she has shown exemplary Hard work and also been instrmental in getting the initial client traction and activity and has completed all the task a entrusted to him in the time and in a good manner. we wish all the best all her for future goals and wishes.`;

            const splitPara2 = doc.splitTextToSize(para2, 170);
            let para2Y = y;
            splitPara2.forEach(line => {
                const nameIndex = line.indexOf(designation);
                if (nameIndex !== -1) {
                    const beforeName = line.substring(0, nameIndex);
                    const afterName = line.substring(nameIndex + designation.length);
                    let xLine = 18;

                    doc.setFont("MyriadPro", "normal");
                    doc.text(beforeName, xLine, para2Y);
                    xLine += doc.getTextWidth(beforeName);

                    doc.setFont("MyriadPro", "bold");
                    doc.text(designation, xLine, para2Y);
                    xLine += doc.getTextWidth(designation);

                    doc.setFont("MyriadPro", "normal");
                    doc.text(afterName, xLine, para2Y);
                } else {
                    doc.setFont("MyriadPro", "normal");
                    doc.text(line, 18, para2Y);
                }
                para2Y += 8;
            });
            y = para2Y + 5;

            doc.save("Internship-certificate-Letter.pdf");
        } catch (error) {
            console.error("Error loading background image or font:", error);
        }
    };

    const generatePDFInternship3 = async () => {
        const {
            employeeName,
            designation,
            salary,
            startdate,
            enddate,
        } = formData;

        const doc = new jsPDF({
            orientation: "portrait",
            unit: "mm",
            format: "a4"
        });

        const formattedstartdate = formatDate(startdate);
        const formattedenddate = formatDate(enddate);

        try {
            // Add Myriad Pro font
            const fontBase64 = await getBase64FromUrl2(`https://admin-software-management.vercel.app/MYRIADPRO-REGULAR.ttf`);
            doc.addFileToVFS('MYRIADPRO-REGULAR.ttf', fontBase64);
            doc.addFont('MYRIADPRO-REGULAR.ttf', 'MyriadPro', 'normal');

            const boldFontBase64 = await getBase64FromUrl2(`https://admin-software-management.vercel.app/MYRIADPRO-BOLD.ttf`);
            doc.addFileToVFS('MYRIADPRO-BOLD.ttf', boldFontBase64);
            doc.addFont('MYRIADPRO-BOLD.ttf', 'MyriadPro', 'bold');

            // Function to add internship content to a page
            const addInternshipContent = () => {
                doc.setFontSize(14);
                doc.setFont("MyriadPro", "normal");
                doc.text(`${formatDate(new Date())}`, 181, 36, { align: "center" });


                doc.setFontSize(12);
                let y = 60;

                // Subject - Bold (Modified for Internship)
                doc.setFontSize(17);
                doc.setFont("MyriadPro", "bold");
                doc.setTextColor(7, 119, 171);
                const text = `OFFER OF EMPLOYMENT - ${designation}`.toUpperCase();
                doc.text(text, 52, y);
                const textWidth = doc.getTextWidth(text);
                const lineY = y + 3;
                doc.setDrawColor(7, 119, 171);
                doc.line(52, lineY, 52 + textWidth, lineY);
                y += 15;



                doc.setFontSize(14);
                doc.setFont("MyriadPro", "bold");
                doc.setTextColor(7, 119, 171);
                doc.text(`Dear, ${employeeName},`, 25, y);
                y += 10;

                // ----- Paragraph 1 with automatic line breaks (Modified for Internship) -----
                doc.setFontSize(13);
                doc.setFont("MyriadPro", "normal");
                doc.setTextColor(0, 0, 0);

                // Create the complete paragraph text for internship
                const paragraph1 = `We are pleased to extend an offer of employment for the position of ${designation} at Plexus Technology After Careful consideration of your application and interviews, we are impressed your skills and potential contributions to our team. Congratulations, and welcome to the team plexus technology. we have pleasure in welcoming you and looking forward to mutually meaningful association. yours truly,`;

                // Split text to fit within page width (170mm width to leave margins)
                const splitParagraph1 = doc.splitTextToSize(paragraph1, 170);

                // Process each line to apply bold formatting to specific words
                splitParagraph1.forEach(line => {
                    let currentX = 25;

                    // Split the line into words to check for bold formatting
                    const words = line.split(' ');
                    const boldWords = [designation];

                    for (let i = 0; i < words.length; i++) {
                        const word = words[i];
                        const isLastWord = i === words.length - 1;
                        const wordWithSpace = isLastWord ? word : word + ' ';

                        // Check if this word should be bold
                        const shouldBeBold = boldWords.some(boldWord => {
                            if (!boldWord) return false;
                            return word.includes(boldWord.replace(/,/g, ''));
                        });

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

                y += 13; // Add some space after paragraph 1



                doc.setTextColor(7, 119, 171);
                doc.setFontSize(15);
                doc.setFont("MyriadPro", "bold");
                doc.text(`${designation}`, 61, y);

                y += 21
                doc.setFontSize(15);
                doc.setTextColor(0, 0, 0);
                doc.setFont("MyriadPro", "bold");
                doc.text(`${salary} Monthly`, 94, y);

                y += 10
                doc.setFontSize(14);
                doc.setFont("MyriadPro", "bold");
                doc.text(`45 Days`, 94, y);

                y += 10
                doc.setFontSize(14);
                doc.setFont("MyriadPro", "bold");
                doc.text(`${formattedstartdate}`, 94, y);

                y += 10
                doc.setFontSize(14);
                doc.setFont("MyriadPro", "bold");
                doc.text(`(${formattedstartdate} to ${formattedenddate})`, 94, y);
            };

            const addInternshipContent2 = () => {
                doc.setFontSize(13);
                let y = 263;

                doc.setFont("MyriadPro", "normal");
                doc.setTextColor(0, 0, 0);

                const paragraph1 = `I am ${employeeName} with this accept the terms of employment as outlined in this letter.`;

                const splitParagraph1 = doc.splitTextToSize(paragraph1, 170);

                splitParagraph1.forEach(line => {
                    const nameIndex = line.indexOf(employeeName);
                    let xLine = 25;

                    if (nameIndex !== -1) {
                        const beforeName = line.substring(0, nameIndex);
                        const afterName = line.substring(nameIndex + employeeName.length);

                        doc.setFont("MyriadPro", "normal");
                        doc.text(beforeName, xLine, y);
                        xLine += doc.getTextWidth(beforeName);

                        doc.setFont("MyriadPro", "bold");
                        doc.text(employeeName, xLine, y);
                        xLine += doc.getTextWidth(employeeName);

                        doc.setFont("MyriadPro", "normal");
                        doc.text(afterName, xLine, y);
                    } else {
                        doc.setFont("MyriadPro", "normal");
                        doc.text(line, xLine, y);
                    }

                    y += 7; // Next line
                });
            };



            // PAGE 1 - Add background and internship content
            const bg1Base64 = await getBase64FromUrl(`https://admin-software-management.vercel.app/1.png`);
            doc.addImage(bg1Base64, 'PNG', 0, 0, 210, 297);
            doc.setFont("MyriadPro");
            addInternshipContent();

            // PAGE 2 - Add background image only
            doc.addPage();
            const bg2Base64 = await getBase64FromUrl(`https://admin-software-management.vercel.app/2.png`);
            doc.addImage(bg2Base64, 'PNG', 0, 0, 210, 297);

            // PAGE 3 - Add background image only
            doc.addPage();
            const bg3Base64 = await getBase64FromUrl(`https://admin-software-management.vercel.app/3.png`);
            doc.addImage(bg3Base64, 'PNG', 0, 0, 210, 297);

            // PAGE 4 - Add background image only
            doc.addPage();
            const bg4Base64 = await getBase64FromUrl(`https://admin-software-management.vercel.app/4.png`);
            doc.addImage(bg4Base64, 'PNG', 0, 0, 210, 297);

            // PAGE 5 - Add background image only
            doc.addPage();
            const bg5Base64 = await getBase64FromUrl(`https://admin-software-management.vercel.app/5.png`);
            doc.addImage(bg5Base64, 'PNG', 0, 0, 210, 297);

            // PAGE 6 - Add background image only
            doc.addPage();
            const bg6Base64 = await getBase64FromUrl(`https://admin-software-management.vercel.app/6.png`);
            doc.addImage(bg6Base64, 'PNG', 0, 0, 210, 297);

            // PAGE 7 - Add background and internship content
            doc.addPage();
            const bg7Base64 = await getBase64FromUrl(`https://admin-software-management.vercel.app/7.png`);
            doc.addImage(bg7Base64, 'PNG', 0, 0, 210, 297);
            doc.setFont("MyriadPro");
            addInternshipContent2();

            doc.save("Offer-Letter.pdf");
        } catch (error) {
            console.error("Error loading background images or font:", error);
        }
    };

    const handleGeneratePDF = () => {
        if (!validateForm()) {
            return; // Don't generate PDF if validation fails
        }

        if (selectedLetter.id === 'experience') {
            generatePDF();
        } else if (selectedLetter.id === 'internship') {
            generatePDFInternship();
        } else if (selectedLetter.id === 'internship certificate') {
            generatePDFInternship2();
        } else if (selectedLetter.id === 'offer') {
            generatePDFInternship3();
        }
    };

    const formatDate = (inputDate) => {
        const date = new Date(inputDate);
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        return `${day}-${month}-${year}`;
    };

    const handleInputChange = (fieldName, value) => {
        setFormData(prev => ({
            ...prev,
            [fieldName]: value
        }));

        // Special handling for date fields
        if (fieldName.toLowerCase().includes('date')) {
            const formatted = formatDate(value);
            setFormattedData(prev => ({
                ...prev,
                [fieldName]: formatted
            }));
        } else {
            setFormattedData(prev => ({
                ...prev,
                [fieldName]: value
            }));
        }
    };

    const closeModal = () => {
        setShowModal(false);
        setSelectedLetter(null);
        setFormData({});
        setErrors({}); // Clear errors when closing modal
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
                                    <h3 className="text-xl font-[400] text-gray-900 mb-2">{letter.title}</h3>
                                    {/* <p className="text-gray-600 text-sm leading-relaxed">{letter.description}</p> */}
                                    <div className="mt-4 flex items-center text-[#0777AB] font-medium">
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
                        <div className="bg-white px-6 py-4 flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                                <div className="bg-[#0777AB]  p-2 rounded-lg">
                                    {selectedLetter.icon}
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold text-black">{selectedLetter.title}</h2>
                                    {/* <p className="text-blue-100 text-sm">{selectedLetter.description}</p> */}
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

                                        {selectedLetter.id === 'experience' && field.name === 'period' ? (
                                            <select
                                                value={formData[field.name] || ''}
                                                onChange={(e) => {
                                                    handleInputChange(field.name, e.target.value);
                                                    if (errors[field.name]) setErrors(prev => ({ ...prev, [field.name]: '' }));
                                                }}
                                                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${errors[field.name] ? 'border-red-500' : 'border-gray-300'}`}
                                            >
                                                <option value="">Select Period</option>
                                                <option value="Probation Period">Probation</option>
                                                <option value="Training Period">Training</option>
                                            </select>
                                        ) : field.type === 'textarea' ? (
                                            <textarea
                                                value={formData[field.name] || ''}
                                                onChange={(e) => {
                                                    handleInputChange(field.name, e.target.value);
                                                    if (errors[field.name]) setErrors(prev => ({ ...prev, [field.name]: '' }));
                                                }}
                                                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${errors[field.name] ? 'border-red-500' : 'border-gray-300'}`}
                                                rows="3"
                                                placeholder={`Enter ${field.label.toLowerCase()}`}
                                            />
                                        ) : (
                                            <input
                                                type={field.type}
                                                value={formData[field.name] || ''}
                                                onChange={(e) => {
                                                    handleInputChange(field.name, e.target.value);
                                                    if (errors[field.name]) setErrors(prev => ({ ...prev, [field.name]: '' }));
                                                }}
                                                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${errors[field.name] ? 'border-red-500' : 'border-gray-300'}`}
                                                placeholder={field.type === 'date' ? '' : `Enter ${field.label.toLowerCase()}`}
                                            />
                                        )}

                                        {errors[field.name] && (
                                            <p className="text-red-500 text-sm mt-1">{errors[field.name]}</p>
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
                                onClick={handleGeneratePDF}
                                className="px-6 py-2 bg-[#0777AB] text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all flex items-center space-x-2"
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