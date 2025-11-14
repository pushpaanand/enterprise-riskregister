import React, { useState, useEffect, useRef } from 'react';
import { useTheme } from '../hooks/useTheme';
import { Theme } from '../types';
import { SunIcon, MoonIcon, ComputerDesktopIcon } from '../constants';

// Fix: Use React.ReactElement to explicitly use the React namespace and resolve the "Cannot find namespace 'JSX'" error.
const themeOptions: { value: Theme; label: string; icon: React.ReactElement }[] = [
    { value: 'light', label: 'Light', icon: <SunIcon /> },
    { value: 'dark', label: 'Dark', icon: <MoonIcon /> },
    { value: 'system', label: 'System', icon: <ComputerDesktopIcon /> },
];

const ThemeToggle: React.FC = () => {
    const { theme, setTheme } = useTheme();
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const currentOption = themeOptions.find(opt => opt.value === theme) || themeOptions[2];

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center justify-center w-10 h-10 rounded-md bg-base-300/50 dark:bg-dark-300 text-base-content dark:text-dark-content hover:bg-base-300 dark:hover:bg-dark-200 transition-colors"
                aria-label={`Current theme: ${theme}`}
            >
                {currentOption.icon}
            </button>
            {isOpen && (
                <div className="absolute right-0 mt-2 w-36 origin-top-right rounded-md bg-base-200 dark:bg-dark-200 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                    <div className="py-1" role="menu" aria-orientation="vertical" aria-labelledby="options-menu">
                        {themeOptions.map(option => (
                            <button
                                key={option.value}
                                onClick={() => {
                                    setTheme(option.value);
                                    setIsOpen(false);
                                }}
                                className={`w-full text-left flex items-center gap-3 px-4 py-2 text-sm ${
                                    theme === option.value
                                        ? 'bg-brand-primary/20 text-brand-primary'
                                        : 'text-base-content dark:text-dark-content'
                                } hover:bg-base-300 dark:hover:bg-dark-300`}
                                role="menuitem"
                            >
                                {option.icon}
                                <span className="flex-1">{option.label}</span>
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default ThemeToggle;