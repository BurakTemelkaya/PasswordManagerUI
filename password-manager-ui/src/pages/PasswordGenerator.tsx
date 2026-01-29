import { useState, useEffect, useCallback } from 'react';
import { useVaultLock } from '../context/VaultLockContext';
import '../styles/auth.css';
import '../styles/popup.css';

interface PasswordGeneratorProps {
    onBack?: () => void;
    onDashboard?: () => void;
    onSettings?: () => void;
    onGenerate?: (password: string) => void;
}

interface GeneratorOptions {
    length: number;
    uppercase: boolean;
    lowercase: boolean;
    numbers: boolean;
    special: boolean;
    minNumbers: number;
    minSpecial: number;
    avoidAmbiguous: boolean;
}

const PasswordGenerator = ({ onBack, onDashboard, onSettings, onGenerate }: PasswordGeneratorProps) => {
    const { lock } = useVaultLock();
    const isExtension = typeof chrome !== 'undefined' && !!chrome.runtime && !!chrome.runtime.id; // Extension kontrolü

    // Default Options
    const [options, setOptions] = useState<GeneratorOptions>({
        length: 16,
        uppercase: true,
        lowercase: true,
        numbers: true,
        special: true,
        minNumbers: 1,
        minSpecial: 1,
        avoidAmbiguous: false,
    });

    const [password, setPassword] = useState('');
    const [copied, setCopied] = useState(false);

    // Character Sets
    const CHAR_SETS = {
        uppercase: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
        lowercase: 'abcdefghijklmnopqrstuvwxyz',
        numbers: '0123456789',
        special: '!@#$%^&*()_+~`|}{[]:;?><,./-=',
        ambiguous: 'Il1O0'
    };

    const generatePassword = useCallback(() => {
        let chars = '';
        let requiredChars = '';

        // Build character set based on options
        if (options.uppercase) {
            let set = CHAR_SETS.uppercase;
            if (options.avoidAmbiguous) set = set.replace(/[IlO]/g, '');
            chars += set;
            requiredChars += set[Math.floor(Math.random() * set.length)]; // Ensure at least one
        }
        if (options.lowercase) {
            let set = CHAR_SETS.lowercase;
            if (options.avoidAmbiguous) set = set.replace(/[l]/g, '');
            chars += set;
            requiredChars += set[Math.floor(Math.random() * set.length)];
        }
        if (options.numbers) {
            let set = CHAR_SETS.numbers;
            if (options.avoidAmbiguous) set = set.replace(/[10]/g, '');
            chars += set;

            // Ensure minimum numbers
            for (let i = 0; i < options.minNumbers; i++)
                requiredChars += set[Math.floor(Math.random() * set.length)];
        }
        if (options.special) {
            let set = CHAR_SETS.special;
            chars += set;

            // Ensure minimum special
            for (let i = 0; i < options.minSpecial; i++)
                requiredChars += set[Math.floor(Math.random() * set.length)];
        }

        if (!chars) {
            setPassword('');
            return;
        }

        let generatedPassword = requiredChars;
        // Fill the rest
        for (let i = requiredChars.length; i < options.length; i++) {
            generatedPassword += chars[Math.floor(Math.random() * chars.length)];
        }

        // Shuffle result
        generatedPassword = generatedPassword.split('').sort(() => 0.5 - Math.random()).join('');

        // Trim if shuffle messed up length (shouldn't happen but safe)
        if (generatedPassword.length > options.length) {
            generatedPassword = generatedPassword.substring(0, options.length);
        }

        setPassword(generatedPassword);
        setCopied(false);

        if (onGenerate) {
            onGenerate(generatedPassword);
        }
    }, [options, onGenerate]);

    // Initial generation
    useEffect(() => {
        generatePassword();
    }, [generatePassword]);
    // Note: generatePassword depends on 'options', so this runs when options change.
    // Ideally, we might want to debounce if sliders are dragged, but simple is fine.

    const handleCopy = () => {
        navigator.clipboard.writeText(password);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    // Strength Indicator Color
    const getStrengthColor = () => {
        const len = options.length;
        if (len < 8) return '#ef4444'; // Red
        if (len < 12) return '#f59e0b'; // Orange
        if (len < 16) return '#3b82f6'; // Blue
        return '#10b981'; // Green
    };

    return (
        <div className="popup-page popup-dashboard" style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: '600px', maxHeight: '600px' }}>
            {/* Header */}
            <header className="popup-header" style={{ padding: '12px 16px', justifyContent: 'center', flexShrink: 0 }}>
                <div className="popup-header-title" style={{ fontSize: '18px', fontWeight: '600' }}>🎲 Parola Üretici</div>
            </header>

            {/* Scrollable Content Wrapper */}
            <div style={{
                flex: 1,
                overflow: 'auto',
                padding: isExtension ? '0' : '16px',
                display: isExtension ? 'flex' : 'block',
                flexDirection: 'column'
            }}>
                <div className={!isExtension ? 'card' : ''} style={{
                    padding: '24px',
                    background: isExtension ? 'transparent' : 'var(--bg-card)',
                    borderRadius: isExtension ? '0' : '12px',
                    width: '100%',
                    margin: isExtension ? 'auto 0' : '0'
                }}>

                    {/* Display Area */}
                    <div style={{
                        background: 'var(--bg-input)',
                        padding: '16px',
                        borderRadius: '8px',
                        marginBottom: '24px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        border: `1px solid ${getStrengthColor()}`,
                        maxHeight: '120px',
                        overflowY: 'auto'
                    }}>
                        <span style={{
                            fontSize: '18px',
                            fontWeight: 'bold',
                            fontFamily: 'monospace',
                            wordBreak: 'break-all',
                            color: 'var(--text-primary)'
                        }}>
                            {password}
                        </span>
                        <div style={{ display: 'flex', gap: '8px' }}>
                            <button onClick={generatePassword} className="btn-icon" title="Yenile">
                                🔄
                            </button>
                            <button onClick={handleCopy} className="btn-icon" title="Kopyala">
                                {copied ? '✅' : '📋'}
                            </button>
                        </div>
                    </div>

                    {/* Options */}
                    <div className="generator-options">

                        {/* Length Slider */}
                        <div className="form-group" style={{ marginBottom: '20px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                <label>Uzunluk</label>
                                <span style={{ fontWeight: 'bold', color: getStrengthColor() }}>{options.length}</span>
                            </div>
                            <input
                                type="range"
                                min="5"
                                max="128"
                                value={options.length}
                                onChange={(e) => setOptions({ ...options, length: parseInt(e.target.value) })}
                                style={{ width: '100%', cursor: 'pointer' }}
                            />
                        </div>

                        {/* Checkboxes */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                            <label className="checkbox-label" style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                                <input
                                    type="checkbox"
                                    checked={options.uppercase}
                                    onChange={(e) => setOptions({ ...options, uppercase: e.target.checked })}
                                />
                                A-Z (Büyük Harf)
                            </label>
                            <label className="checkbox-label" style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                                <input
                                    type="checkbox"
                                    checked={options.lowercase}
                                    onChange={(e) => setOptions({ ...options, lowercase: e.target.checked })}
                                />
                                a-z (Küçük Harf)
                            </label>
                            <label className="checkbox-label" style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                                <input
                                    type="checkbox"
                                    checked={options.numbers}
                                    onChange={(e) => setOptions({ ...options, numbers: e.target.checked })}
                                />
                                0-9 (Rakamlar)
                            </label>
                            <label className="checkbox-label" style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                                <input
                                    type="checkbox"
                                    checked={options.special}
                                    onChange={(e) => setOptions({ ...options, special: e.target.checked })}
                                />
                                !@# (Özel Karakter)
                            </label>
                            <label className="checkbox-label" style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', gridColumn: 'span 2' }}>
                                <input
                                    type="checkbox"
                                    checked={options.avoidAmbiguous}
                                    onChange={(e) => setOptions({ ...options, avoidAmbiguous: e.target.checked })}
                                />
                                Benzer Karakterleri Önle (l, 1, O, 0)
                            </label>
                        </div>

                        {/* Advanced Counts */}
                        <div style={{ marginTop: '20px', borderTop: '1px solid var(--border-color)', paddingTop: '16px' }}>
                            <div style={{ display: 'flex', gap: '16px' }}>
                                <div style={{ flex: 1 }}>
                                    <label style={{ fontSize: '13px', display: 'block', marginBottom: '4px' }}>Min. Rakam</label>
                                    <input
                                        type="number"
                                        min="0"
                                        max="10"
                                        value={options.minNumbers}
                                        onChange={(e) => setOptions({ ...options, minNumbers: parseInt(e.target.value) })}
                                        className="input"
                                        style={{ padding: '8px' }}
                                        disabled={!options.numbers}
                                    />
                                </div>
                                <div style={{ flex: 1 }}>
                                    <label style={{ fontSize: '13px', display: 'block', marginBottom: '4px' }}>Min. Özel Karakter</label>
                                    <input
                                        type="number"
                                        min="0"
                                        max="10"
                                        value={options.minSpecial}
                                        onChange={(e) => setOptions({ ...options, minSpecial: parseInt(e.target.value) })}
                                        className="input"
                                        style={{ padding: '8px' }}
                                        disabled={!options.special}
                                    />
                                </div>
                            </div>
                        </div>

                    </div>
                </div>
            </div>

            {/* Bottom Navigation */}
            <nav style={{
                background: 'var(--bg-sidebar)',
                borderTop: '1px solid var(--border-color)',
                display: 'flex',
                justifyContent: 'space-around',
                padding: '4px 0',
                flexShrink: 0
            }}>
                <button
                    onClick={() => onDashboard ? onDashboard() : onBack?.()}
                    style={{
                        flex: 1,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '2px',
                        border: 'none',
                        background: 'transparent',
                        color: 'var(--text-muted)',
                        cursor: 'pointer',
                        padding: '6px 4px',
                        fontSize: '10px'
                    }}
                >
                    <span style={{ fontSize: '20px' }}>🏠</span>
                    <span>Kasa</span>
                </button>
                <button
                    style={{
                        flex: 1,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '2px',
                        border: 'none',
                        background: 'transparent',
                        color: 'var(--primary-color)',
                        cursor: 'pointer',
                        padding: '6px 4px',
                        fontSize: '10px'
                    }}
                >
                    <span style={{ fontSize: '20px' }}>🎲</span>
                    <span style={{ fontWeight: '600' }}>Üreteci</span>
                </button>
                <button
                    onClick={() => onSettings?.()}
                    style={{
                        flex: 1,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '2px',
                        border: 'none',
                        background: 'transparent',
                        color: 'var(--text-muted)',
                        cursor: 'pointer',
                        padding: '6px 4px',
                        fontSize: '10px'
                    }}
                >
                    <span style={{ fontSize: '20px' }}>⚙️</span>
                    <span>Ayarlar</span>
                </button>
                <button
                    onClick={() => {
                        lock();
                        if (typeof chrome !== 'undefined' && chrome.runtime) {
                            setTimeout(() => window.close(), 100);
                        }
                    }}
                    style={{
                        flex: 1,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '2px',
                        border: 'none',
                        background: 'transparent',
                        color: 'var(--text-muted)',
                        cursor: 'pointer',
                        padding: '6px 4px',
                        fontSize: '10px'
                    }}
                >
                    <span style={{ fontSize: '20px' }}>🔒</span>
                    <span>Kilitle</span>
                </button>
            </nav>
        </div>
    );
};

export default PasswordGenerator;
