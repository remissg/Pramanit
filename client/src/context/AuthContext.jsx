import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(localStorage.getItem('token'));
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (token) {
            axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
            fetchProfile();
        } else {
            delete axios.defaults.headers.common['Authorization'];
            setLoading(false);
        }
    }, [token]);

    const fetchProfile = async () => {
        try {
            const res = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/auth/profile`);
            setUser(res.data);
        } catch (err) {
            console.error('Failed to fetch profile', err);
            logout();
        } finally {
            setLoading(false);
        }
    };

    const login = async (email, password) => {
        const res = await axios.post(`${import.meta.env.VITE_API_BASE_URL}/api/auth/login`, { email, password });
        localStorage.setItem('token', res.data.token);
        setToken(res.data.token);
        setUser(res.data.user);
        return res.data.user;
    };

    const signup = async (email, password, orgName, fullName, designation, issuerType, institutionIdNumber, officialIdDoc, institutionName = '', institutionWebsite = '', facultyEmail = '') => {
        let res;
        if (officialIdDoc) {
            const formData = new FormData();
            formData.append('email', email);
            formData.append('password', password);
            formData.append('orgName', orgName);
            formData.append('fullName', fullName);
            formData.append('designation', designation);
            formData.append('issuerType', issuerType || 'institution');
            formData.append('verificationCategory', issuerType || 'institution');
            formData.append('institutionName', institutionName);
            formData.append('institutionWebsite', institutionWebsite);
            formData.append('facultyEmail', facultyEmail);
            formData.append('institutionIdNumber', institutionIdNumber || '');
            formData.append('officialIdDoc', officialIdDoc);
            res = await axios.post(`${import.meta.env.VITE_API_BASE_URL}/api/auth/signup`, formData);
        } else {
            res = await axios.post(`${import.meta.env.VITE_API_BASE_URL}/api/auth/signup`, {
                email, password, orgName, fullName, designation, issuerType, verificationCategory: issuerType, institutionIdNumber, institutionName, institutionWebsite, facultyEmail
            });
        }
        localStorage.setItem('token', res.data.token);
        setToken(res.data.token);
        setUser(res.data.user);
        return res.data.user;
    };

    const updateSession = (userData, userToken) => {
        localStorage.setItem('token', userToken);
        setToken(userToken);
        setUser(userData);
        axios.defaults.headers.common['Authorization'] = `Bearer ${userToken}`;
    };

    const logout = () => {
        localStorage.removeItem('token');
        setToken(null);
        setUser(null);
        delete axios.defaults.headers.common['Authorization'];
    };

    return (
        <AuthContext.Provider value={{ user, token, login, signup, logout, loading, updateSession }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
