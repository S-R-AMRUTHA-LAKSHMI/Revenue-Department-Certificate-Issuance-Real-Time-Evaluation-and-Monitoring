import React from 'react';
import { useParams } from 'react-router-dom';

const API_URL = 'http://localhost:5000/api';

const DownloadPage = () => {
    const { filename } = useParams();

    const handleDownload = () => {
        window.location.href = `${API_URL}/download/${filename}`;
    };

    return (
        <div>
            <h1>Certificate Generated Successfully!</h1>
            <button onClick={handleDownload}>Download Certificate</button>
        </div>
    );
};

export default DownloadPage;
