// Configuration - CHANGE THIS CODE TO YOUR 6-DIGIT ACCESS CODE
const ACCESS_CODE = "144977"; // Change this to your desired 6-digit code

// DOM Elements
const authContainer = document.getElementById('authContainer');
const appContainer = document.getElementById('appContainer');
const authForm = document.getElementById('authForm');
const accessCodeInput = document.getElementById('accessCode');
const accessCodeError = document.getElementById('accessCodeError');
const greetingText = document.getElementById('greetingText');
const logoutBtn = document.getElementById('logoutBtn');
const passwordTableBody = document.getElementById('passwordTableBody');
const addPasswordBtn = document.getElementById('addPasswordBtn');
const passwordModal = document.getElementById('passwordModal');
const modalTitle = document.getElementById('modalTitle');
const passwordForm = document.getElementById('passwordForm');
const passwordIdInput = document.getElementById('passwordId');
const accountTypeInput = document.getElementById('accountType');
const accountIdentifierInput = document.getElementById('accountIdentifier');
const passwordInput = document.getElementById('password');
const togglePassword = document.getElementById('togglePassword');
const modalClose = document.getElementById('modalClose');
const cancelBtn = document.getElementById('cancelBtn');
const contextMenu = document.getElementById('contextMenu');
const editBtn = document.getElementById('editBtn');
const deleteBtn = document.getElementById('deleteBtn');
const toast = document.getElementById('toast');
const exportBtn = document.getElementById('exportBtn');
const importBtn = document.getElementById('importBtn');
const importFile = document.getElementById('importFile');

// State
let selectedPasswordId = null;
let isEditing = false;
let encryptionKey = '';

// Initialize the app
function init() {
    // Check if user is already authenticated
    const storedKey = localStorage.getItem('encryptionKey');
    if (storedKey) {
        encryptionKey = storedKey;
        showApp();
    } else {
        showAuth();
    }
    
    // Set up event listeners
    setupEventListeners();
    
    // Load passwords
    loadPasswords();
}

// Set up event listeners
function setupEventListeners() {
    // Auth form submission
    authForm.addEventListener('submit', handleAuthSubmit);
    
    // Logout button
    logoutBtn.addEventListener('click', handleLogout);
    
    // Add password button
    addPasswordBtn.addEventListener('click', () => {
        showPasswordModal(false);
    });
    
    // Password form submission
    passwordForm.addEventListener('submit', handlePasswordSubmit);
    
    // Modal close buttons
    modalClose.addEventListener('click', () => {
        passwordModal.style.display = 'none';
    });
    
    cancelBtn.addEventListener('click', () => {
        passwordModal.style.display = 'none';
    });
    
    // Toggle password visibility
    togglePassword.addEventListener('click', () => {
        const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
        passwordInput.setAttribute('type', type);
        togglePassword.innerHTML = type === 'password' ? '<i class="fas fa-eye"></i>' : '<i class="fas fa-eye-slash"></i>';
    });
    
    // Context menu buttons
    editBtn.addEventListener('click', handleEditPassword);
    deleteBtn.addEventListener('click', handleDeletePassword);
    
    // Close context menu when clicking elsewhere
    document.addEventListener('click', (e) => {
        if (!contextMenu.contains(e.target)) {
            contextMenu.style.display = 'none';
        }
    });
    
    // Table row long press for context menu
    passwordTableBody.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        const row = e.target.closest('tr');
        if (row && row.dataset.id) {
            selectedPasswordId = row.dataset.id;
            showContextMenu(e.clientX, e.clientY);
        }
    });
    
    // For touch devices
    let touchTimer;
    passwordTableBody.addEventListener('touchstart', (e) => {
        const row = e.target.closest('tr');
        if (row && row.dataset.id) {
            selectedPasswordId = row.dataset.id;
            touchTimer = setTimeout(() => {
                showContextMenu(e.touches[0].clientX, e.touches[0].clientY);
            }, 500); // 500ms long press
        }
    });
    
    passwordTableBody.addEventListener('touchend', () => {
        clearTimeout(touchTimer);
    });
    
    // Export/Import buttons
    exportBtn.addEventListener('click', handleExport);
    importBtn.addEventListener('click', () => {
        importFile.click();
    });
    
    importFile.addEventListener('change', handleImport);
}

// Authentication functions
function handleAuthSubmit(e) {
    e.preventDefault();
    const enteredCode = accessCodeInput.value;
    
    if (enteredCode === ACCESS_CODE) {
        // Generate encryption key from access code
        encryptionKey = generateEncryptionKey(enteredCode);
        localStorage.setItem('encryptionKey', encryptionKey);
        showApp();
    } else {
        accessCodeError.style.display = 'block';
        accessCodeInput.value = '';
        accessCodeInput.focus();
    }
}

function handleLogout() {
    localStorage.removeItem('encryptionKey');
    encryptionKey = '';
    showAuth();
    accessCodeInput.value = '';
    accessCodeError.style.display = 'none';
}

// Password CRUD operations
function loadPasswords() {
    const encryptedPasswords = localStorage.getItem('passwords');
    if (!encryptedPasswords) {
        passwordTableBody.innerHTML = '<tr><td colspan="4" class="no-data">Belum Ada Data</td></tr>';
        return;
    }
    
    try {
        const passwords = JSON.parse(encryptedPasswords).map(pw => ({
            ...pw,
            password: decryptData(pw.password)
        }));
        
        if (passwords.length === 0) {
            passwordTableBody.innerHTML = '<tr><td colspan="4" class="no-data">Belum Ada Data</td></tr>';
            return;
        }
        
        passwordTableBody.innerHTML = '';
        passwords.forEach((password, index) => {
            const row = document.createElement('tr');
            row.dataset.id = password.id;
            row.innerHTML = `
                <td>${index + 1}</td>
                <td>${password.accountType}</td>
                <td>${password.accountIdentifier}</td>
                <td class="password-cell">••••••••</td>
            `;
            
            // Add click event to show/hide password
            const passwordCell = row.querySelector('.password-cell');
            passwordCell.addEventListener('click', () => {
                if (passwordCell.textContent === '••••••••') {
                    passwordCell.textContent = password.password;
                    setTimeout(() => {
                        passwordCell.textContent = '••••••••';
                    }, 3000);
                } else {
                    passwordCell.textContent = '••••••••';
                }
            });
            
            passwordTableBody.appendChild(row);
        });
    } catch (error) {
        console.error('Error loading passwords:', error);
        showToast('Error loading passwords', 'error');
    }
}

function savePassword(passwordData) {
    const encryptedPassword = {
        ...passwordData,
        password: encryptData(passwordData.password)
    };
    
    let passwords = [];
    const storedPasswords = localStorage.getItem('passwords');
    
    if (storedPasswords) {
        passwords = JSON.parse(storedPasswords);
    }
    
    if (isEditing) {
        const index = passwords.findIndex(pw => pw.id === passwordData.id);
        if (index !== -1) {
            passwords[index] = encryptedPassword;
        }
    } else {
        encryptedPassword.id = Date.now().toString();
        passwords.push(encryptedPassword);
    }
    
    localStorage.setItem('passwords', JSON.stringify(passwords));
    loadPasswords();
    showToast(`Password ${isEditing ? 'updated' : 'saved'} successfully`);
}

function deletePassword(id) {
    const storedPasswords = localStorage.getItem('passwords');
    if (!storedPasswords) return;
    
    const passwords = JSON.parse(storedPasswords);
    const filteredPasswords = passwords.filter(pw => pw.id !== id);
    
    localStorage.setItem('passwords', JSON.stringify(filteredPasswords));
    loadPasswords();
    showToast('Password deleted successfully');
}

// Form handlers
function handlePasswordSubmit(e) {
    e.preventDefault();
    
    const passwordData = {
        id: passwordIdInput.value,
        accountType: accountTypeInput.value,
        accountIdentifier: accountIdentifierInput.value,
        password: passwordInput.value
    };
    
    savePassword(passwordData);
    passwordModal.style.display = 'none';
    passwordForm.reset();
}

function handleEditPassword() {
    contextMenu.style.display = 'none';
    if (!selectedPasswordId) return;
    
    const storedPasswords = localStorage.getItem('passwords');
    if (!storedPasswords) return;
    
    const passwords = JSON.parse(storedPasswords);
    const passwordToEdit = passwords.find(pw => pw.id === selectedPasswordId);
    
    if (passwordToEdit) {
        passwordIdInput.value = passwordToEdit.id;
        accountTypeInput.value = passwordToEdit.accountType;
        accountIdentifierInput.value = passwordToEdit.accountIdentifier;
        passwordInput.value = decryptData(passwordToEdit.password);
        
        showPasswordModal(true);
    }
}

function handleDeletePassword() {
    contextMenu.style.display = 'none';
    if (!selectedPasswordId) return;
    
    if (confirm('Are you sure you want to delete this password?')) {
        deletePassword(selectedPasswordId);
    }
}

// Import/Export functions
function handleExport() {
    const storedPasswords = localStorage.getItem('passwords');
    if (!storedPasswords) {
        showToast('No passwords to export', 'error');
        return;
    }
    
    try {
        const data = {
            version: 1,
            passwords: JSON.parse(storedPasswords)
        };
        
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `password-manager-export-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        showToast('Passwords exported successfully');
    } catch (error) {
        console.error('Error exporting passwords:', error);
        showToast('Error exporting passwords', 'error');
    }
}

function handleImport(e) {
    const file = e.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (event) => {
        try {
            const data = JSON.parse(event.target.result);
            if (!data.passwords || !Array.isArray(data.passwords)) {
                throw new Error('Invalid file format');
            }
            
            if (confirm(`Are you sure you want to import ${data.passwords.length} passwords? This will overwrite your current data.`)) {
                localStorage.setItem('passwords', JSON.stringify(data.passwords));
                loadPasswords();
                showToast('Passwords imported successfully');
            }
        } catch (error) {
            console.error('Error importing passwords:', error);
            showToast('Error importing passwords. Invalid file format.', 'error');
        }
    };
    reader.readAsText(file);
    e.target.value = ''; // Reset file input
}

// UI Helpers
function showAuth() {
    authContainer.style.display = 'flex';
    appContainer.style.display = 'none';
}

function showApp() {
    authContainer.style.display = 'none';
    appContainer.style.display = 'block';
}

function showPasswordModal(editing) {
    isEditing = editing;
    modalTitle.textContent = editing ? 'Edit Password' : 'Tambah Password';
    
    if (!editing) {
        passwordForm.reset();
        passwordIdInput.value = '';
    }
    
    passwordModal.style.display = 'flex';
    accountTypeInput.focus();
}

function showContextMenu(x, y) {
    contextMenu.style.display = 'block';
    contextMenu.style.left = `${x}px`;
    contextMenu.style.top = `${y}px`;
}

function showToast(message, type = 'success') {
    toast.textContent = message;
    toast.style.backgroundColor = type === 'error' ? 'var(--danger-color)' : 'var(--success-color)';
    toast.style.display = 'block';
    
    setTimeout(() => {
        toast.style.display = 'none';
    }, 3000);
}

// Encryption functions
function generateEncryptionKey(accessCode) {
    // Simple key derivation - in a real app, use a more secure method
    return window.btoa(accessCode + 'SALT_VALUE').substring(0, 32);
}

function encryptData(data) {
    // Simple XOR encryption - in a real app, use Web Crypto API
    let result = '';
    for (let i = 0; i < data.length; i++) {
        const keyChar = encryptionKey.charCodeAt(i % encryptionKey.length);
        const dataChar = data.charCodeAt(i);
        result += String.fromCharCode(dataChar ^ keyChar);
    }
    return window.btoa(result);
}

function decryptData(encryptedData) {
    try {
        const data = window.atob(encryptedData);
        let result = '';
        for (let i = 0; i < data.length; i++) {
            const keyChar = encryptionKey.charCodeAt(i % encryptionKey.length);
            const dataChar = data.charCodeAt(i);
            result += String.fromCharCode(dataChar ^ keyChar);
        }
        return result;
    } catch (error) {
        console.error('Decryption error:', error);
        return '********';
    }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', init);

// Service Worker Registration for PWA
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('sw.js').then(registration => {
            console.log('ServiceWorker registration successful');
        }).catch(err => {
            console.log('ServiceWorker registration failed: ', err);
        });
    });
}