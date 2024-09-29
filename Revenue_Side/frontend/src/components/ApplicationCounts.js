import React, { useEffect, useState } from 'react';
import { fetchApplicationCounts } from '../api';
import './global.css';

const ApplicationCounts = ({ location, certificate }) => {
    const [counts, setCounts] = useState([]);
    useEffect(() => {
        const getApplicationCounts = async () => {
            if (location && certificate) {
                const data = await fetchApplicationCounts(location, certificate);
                setCounts(data);
            }
        };
        getApplicationCounts();
    }, [location, certificate]);

    return (
        <div>
            {counts.map((count) => (
                <div key={count.status}>
                    <h4>{count.status}: {count.count}</h4>
                </div>
            ))}
        </div>
    );
};

export default ApplicationCounts;
