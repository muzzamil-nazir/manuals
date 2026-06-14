const API_BASE = 'https://manuals-rkhr.onrender.com/api';
const TOKEN_KEY = 'manualUploadToken';
const USER_KEY = 'manualUploadUser';
const page = document.body.dataset.page;

let selectedFile = null;
let filesData = [];

window.addEventListener('DOMContentLoaded', () => {
  if (page === 'dashboard') {
    initDashboard();
  } else if (page === 'login') {
    initLoginPage();
  } else if (page === 'register') {
    initRegisterPage();
  } else if (page === 'admin') {
    initAdminPanel();
  }
});

function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

function getUser() {
  try {
    return JSON.parse(localStorage.getItem(USER_KEY));
  } catch (err) {
    return null;
  }
}

function saveSession(token, user) {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

function clearSession() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

function redirectToLogin() {
  clearSession();
  window.location.href = 'login.html';
}

async function authFetch(url, options = {}) {
  const token = getToken();
  if (!token) {
    redirectToLogin();
    return null;
  }

  const headers = options.headers || {};
  headers.Authorization = `Bearer ${token}`;
  if (options.body && !(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  const response = await fetch(url, { ...options, headers });
  if (response.status === 401) {
    redirectToLogin();
    return null;
  }

  return response;
}

function initDashboard() {
  const fileInput = document.getElementById('fileInput');
  const selectFileBtn = document.getElementById('selectFileBtn');
  const uploadBtn = document.getElementById('uploadBtn');
  const dropZone = document.getElementById('dropZone');
  const selectedFileName = document.getElementById('selectedFileName');
  const progressBar = document.querySelector('.progress-bar');
  const progressBarFill = document.getElementById('progressBarFill');
  const uploadMessage = document.getElementById('uploadMessage');
  const fileList = document.getElementById('fileList');
  const filesCount = document.getElementById('filesCount');
  const searchInput = document.getElementById('searchInput');
  const logoutBtn = document.getElementById('logoutBtn');
  const userNameDisplay = document.getElementById('userNameDisplay');
  const upgradeBtn = document.getElementById('upgradeBtn');

  const token = getToken();
  const user = getUser();

  if (!token || !user) {
    redirectToLogin();
    return;
  }

  userNameDisplay.textContent = user.name;

  // Load user info and storage
  loadUserInfo();

  // Setup upgrade button
  if (upgradeBtn) {
    upgradeBtn.addEventListener('click', handleUpgrade);
  }

  selectFileBtn.addEventListener('click', () => fileInput.click());
  fileInput.addEventListener('change', () => {
    selectedFileName.textContent = fileInput.files[0]?.name || 'No file selected';
    uploadBtn.disabled = !fileInput.files[0];
  });

  dropZone.addEventListener('dragenter', handleDragEnter);
  dropZone.addEventListener('dragover', handleDragOver);
  dropZone.addEventListener('dragleave', handleDragLeave);
  dropZone.addEventListener('drop', (event) => handleDrop(event, selectedFileName, uploadBtn, uploadMessage));

  uploadBtn.addEventListener('click', () => {
    handleUpload(uploadBtn, uploadMessage, progressBar, progressBarFill, uploadMessage, fileList, filesCount, searchInput);
  });

  dropZone.addEventListener('dragenter', handleDragEnter);
  dropZone.addEventListener('dragover', handleDragOver);
  dropZone.addEventListener('dragleave', handleDragLeave);
  dropZone.addEventListener('drop', (event) => handleDrop(event, selectedFileName, uploadBtn, uploadMessage));

  logoutBtn.addEventListener('click', () => {
    clearSession();
    window.location.href = 'login.html';
  });

  fetchFiles(fileList, filesCount, searchInput);
}

function loadUserInfo() {
  dropZone.addEventListener('drop', (event) => handleDrop(event, selectedFileName, uploadBtn, uploadMessage));

  logoutBtn.addEventListener('click', () => {
    clearSession();
    window.location.href = 'login.html';
  });

  fetchFiles(fileList, filesCount, searchInput);
}

function initLoginPage() {
  const loginForm = document.getElementById('loginForm');
  const authMessage = document.getElementById('authMessage');

  if (getToken()) {
    window.location.href = 'index.html';
    return;
  }

  loginForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value.trim();

    if (!email || !password) {
      setAuthMessage(authMessage, 'Please enter email and password.', false);
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const result = await response.json();
      if (!response.ok || !result.success) {
        setAuthMessage(authMessage, result.message || 'Login failed.', false);
        return;
      }

      saveSession(result.token, result.user);
      window.location.href = 'index.html';
    } catch (error) {
      setAuthMessage(authMessage, 'Unable to login. Please try again.', false);
    }
  });
}

function initRegisterPage() {
  const registerForm = document.getElementById('registerForm');
  const authMessage = document.getElementById('authMessage');

  if (getToken()) {
    window.location.href = 'index.html';
    return;
  }

  registerForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const name = document.getElementById('registerName').value.trim();
    const email = document.getElementById('registerEmail').value.trim();
    const password = document.getElementById('registerPassword').value.trim();

    if (!name || !email || !password) {
      setAuthMessage(authMessage, 'All fields are required.', false);
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      });

      const result = await response.json();
      if (!response.ok || !result.success) {
        setAuthMessage(authMessage, result.message || 'Registration failed.', false);
        return;
      }

      setAuthMessage(authMessage, 'Registration successful. Redirecting to login...', true);
      setTimeout(() => {
        window.location.href = 'login.html';
      }, 1200);
    } catch (error) {
      setAuthMessage(authMessage, 'Unable to register. Please try again.', false);
    }
  });
}

function handleFileSelection(event, selectedFileName, uploadBtn, uploadMessage) {
  const file = event.target.files[0];
  selectedFile = file;
  if (file) {
    selectedFileName.textContent = file.name;
    uploadBtn.disabled = false;
    uploadMessage.textContent = '';
    uploadMessage.className = 'message';
  } else {
    selectedFileName.textContent = 'No file selected';
    uploadBtn.disabled = true;
  }
}

function handleDragEnter(event) {
  event.preventDefault();
  event.currentTarget.classList.add('drag-over');
}

function handleDragOver(event) {
  event.preventDefault();
  event.currentTarget.classList.add('drag-over');
}

function handleDragLeave(event) {
  event.currentTarget.classList.remove('drag-over');
}

function handleDrop(event, selectedFileName, uploadBtn, uploadMessage) {
  event.preventDefault();
  event.currentTarget.classList.remove('drag-over');
  const file = event.dataTransfer.files[0];
  selectedFile = file;
  if (file) {
    selectedFileName.textContent = file.name;
    uploadBtn.disabled = false;
    uploadMessage.textContent = '';
    uploadMessage.className = 'message';
  }
}

function handleUpload(selectedFileArg, fileInput, selectedFileName, uploadBtn, progressBar, progressBarFill, uploadMessage) {
  if (!selectedFile) {
    setAuthMessage(uploadMessage, 'Please choose a file before uploading.', false);
    return;
  }

  const token = getToken();
  if (!token) {
    redirectToLogin();
    return;
  }

  const formData = new FormData();
  formData.append('file', selectedFile);

  const xhr = new XMLHttpRequest();
  xhr.open('POST', `${API_BASE}/upload`, true);
  xhr.setRequestHeader('Authorization', `Bearer ${token}`);

  xhr.upload.onprogress = (event) => {
    if (event.lengthComputable) {
      const percent = Math.round((event.loaded / event.total) * 100);
      progressBar.hidden = false;
      progressBarFill.style.width = `${percent}%`;
    }
  };

  xhr.onload = () => {
    progressBarFill.style.width = '0%';
    progressBar.hidden = true;

    if (xhr.status === 401) {
      redirectToLogin();
      return;
    }

    const response = safeParseJSON(xhr.responseText);
    
    if (xhr.status === 413) {
      // Storage limit exceeded
      setAuthMessage(uploadMessage, response.message || 'Storage limit exceeded. Upgrade to Premium.', false);
      loadUserInfo();
      return;
    }

    if (xhr.status >= 200 && xhr.status < 300 && response.success) {
      setAuthMessage(uploadMessage, response.message, true);
      selectedFile = null;
      fileInput.value = '';
      selectedFileName.textContent = 'No file selected';
      uploadBtn.disabled = true;
      loadUserInfo();
      fetchFiles();
    } else {
      setAuthMessage(uploadMessage, response.message || 'Upload failed.', false);
    }
  };

  xhr.onerror = () => {
    progressBar.hidden = true;
    setAuthMessage(uploadMessage, 'Upload failed due to a network error.', false);
  };

  xhr.send(formData);
}

async function fetchFiles(fileList, filesCount, searchInput) {
  try {
    const response = await authFetch(`${API_BASE}/files`);
    if (!response) return;
    const result = await response.json();
    if (!response.ok || !result.success) {
      filesCount.textContent = 'Unable to load files.';
      return;
    }
    filesData = result.data || [];
    renderFiles(filesData, fileList, filesCount, searchInput.value);
  } catch (error) {
    filesCount.textContent = 'Unable to load files.';
  }
}

function renderFiles(files, fileList, filesCount, query = '') {
  const filteredFiles = filterFiles(files, query.trim());
  fileList.innerHTML = '';
  filesCount.textContent = `${filteredFiles.length} file${filteredFiles.length === 1 ? '' : 's'} uploaded`;

  if (!filteredFiles.length) {
    fileList.innerHTML = '<div class="message">No files found. Upload a file to get started.</div>';
    return;
  }

  filteredFiles.forEach((file) => {
    const card = document.createElement('article');
    card.className = 'file-card';

    const preview = document.createElement('div');
    preview.className = 'file-preview';
    const previewContent = getPreviewContent(file);
    preview.appendChild(previewContent);

    const info = document.createElement('div');
    info.className = 'file-info';

    const name = document.createElement('div');
    name.className = 'file-name';
    name.textContent = file.originalName;

    const meta = document.createElement('div');
    meta.className = 'file-meta';
    meta.textContent = `${formatSize(file.fileSize)} · ${formatDate(file.uploadDate)} · ${file.fileType}`;

    info.appendChild(name);
    info.appendChild(meta);

    const actions = document.createElement('div');
    actions.className = 'file-actions';

    const downloadButton = document.createElement('button');
    downloadButton.className = 'download-btn';
    downloadButton.textContent = 'Download';
    downloadButton.addEventListener('click', () => handleDownload(file.id));

    const deleteButton = document.createElement('button');
    deleteButton.className = 'delete-btn';
    deleteButton.textContent = 'Delete';
    deleteButton.addEventListener('click', () => handleDelete(file.id, fileList, filesCount, searchInput));

    actions.appendChild(downloadButton);
    actions.appendChild(deleteButton);

    card.appendChild(preview);
    card.appendChild(info);
    card.appendChild(actions);
    fileList.appendChild(card);
  });
}

function getPreviewContent(file) {
  const imageTypes = ['image/jpeg', 'image/png', 'image/jpg'];
  if (imageTypes.includes(file.fileType)) {
    const img = document.createElement('img');
    img.src = `https://manuals-rkhr.onrender.com/${file.filePath}`;
    img.alt = file.originalName;
    return img;
  }

  const icon = document.createElement('span');
  icon.className = 'file-icon';
  if (file.fileType.includes('pdf')) {
    icon.textContent = '📄';
  } else if (file.fileType.includes('word')) {
    icon.textContent = '📄';
  } else if (file.fileType === 'text/plain') {
    icon.textContent = '📄';
  } else {
    icon.textContent = '📁';
  }
  return icon;
}

function formatSize(sizeInKB) {
  if (sizeInKB >= 1024) {
    return `${(sizeInKB / 1024).toFixed(1)} MB`;
  }
  return `${sizeInKB} KB`;
}

function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

async function handleDownload(id) {
  const token = getToken();
  if (!token) {
    redirectToLogin();
    return;
  }

  try {
    const response = await fetch(`${API_BASE}/download/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (response.status === 401) {
      redirectToLogin();
      return;
    }
    if (!response.ok) {
      alert('Download failed.');
      return;
    }

    const blob = await response.blob();
    const disposition = response.headers.get('Content-Disposition') || '';
    const filename = getFileNameFromDisposition(disposition) || 'downloaded-file';
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = filename;
    anchor.click();
    URL.revokeObjectURL(url);
  } catch (error) {
    alert('Download failed. Please try again.');
  }
}

function getFileNameFromDisposition(disposition) {
  const fileNameMatch = /filename="?(.*?)"?$/.exec(disposition);
  return fileNameMatch ? fileNameMatch[1] : null;
}

async function handleDelete(id, fileList, filesCount, searchInput) {
  const confirmed = window.confirm('Delete this file permanently?');
  if (!confirmed) return;

  const response = await authFetch(`${API_BASE}/files/${id}`, { method: 'DELETE' });
  if (!response) return;
  const result = await response.json();
  if (!response.ok || !result.success) {
    alert(result.message || 'Delete failed.');
    return;
  }

  filesData = filesData.filter((file) => file.id !== id);
  renderFiles(filesData, fileList, filesCount, searchInput.value);
}

function filterFiles(files, query) {
  if (!query) return files;
  const lowerQuery = query.toLowerCase();
  return files.filter((file) => file.originalName.toLowerCase().includes(lowerQuery));
}

function setAuthMessage(element, message, success) {
  element.textContent = message;
  element.className = `message ${success ? 'success' : 'error'}`;
}

function safeParseJSON(text) {
  try {
    return JSON.parse(text);
  } catch (err) {
    return {};
  }
}

function initAdminPanel() {
  const user = getUser();
  const token = getToken();

  if (!token || !user || user.role !== 'admin') {
    redirectToLogin();
    return;
  }

  const logoutBtn = document.getElementById('logoutBtn');
  const userNameDisplay = document.getElementById('userNameDisplay');
  const tabBtns = document.querySelectorAll('.tab-btn');
  const usersTab = document.getElementById('usersTab');
  const filesTab = document.getElementById('filesTab');

  userNameDisplay.textContent = `Admin: ${user.name}`;

  tabBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      tabBtns.forEach((b) => b.classList.remove('active'));
      document.querySelectorAll('.tab-content').forEach((content) => content.classList.remove('active'));
      btn.classList.add('active');
      const tabName = btn.dataset.tab;
      if (tabName === 'users') {
        usersTab.classList.add('active');
      } else if (tabName === 'files') {
        filesTab.classList.add('active');
      }
    });
  });

  logoutBtn.addEventListener('click', () => {
    clearSession();
    window.location.href = 'login.html';
  });

  fetchAdminStats();
  fetchAdminUsers();
  fetchAdminFiles();
}

async function fetchAdminStats() {
  try {
    const response = await authFetch(`${API_BASE}/admin/stats`);
    if (!response) return;
    const result = await response.json();
    if (!response.ok || !result.success) return;

    const stats = result.data;
    document.getElementById('statTotalUsers').textContent = stats.totalUsers;
    document.getElementById('statActiveUsers').textContent = stats.activeUsers;
    document.getElementById('statBlockedUsers').textContent = stats.blockedUsers;
    document.getElementById('statTotalFiles').textContent = stats.totalFiles;
    document.getElementById('statStorageUsed').textContent = `${(stats.totalStorageUsed / 1024).toFixed(1)} MB`;
  } catch (error) {
    console.error('Failed to fetch admin stats:', error);
  }
}

async function fetchAdminUsers() {
  try {
    const response = await authFetch(`${API_BASE}/admin/users`);
    if (!response) return;
    const result = await response.json();
    if (!response.ok || !result.success) return;

    const tbody = document.getElementById('usersTableBody');
    tbody.innerHTML = '';

    if (!result.data || result.data.length === 0) {
      tbody.innerHTML = '<tr><td colspan="5" class="text-center">No users found.</td></tr>';
      return;
    }

    result.data.forEach((user) => {
      const tr = document.createElement('tr');
      const statusClass = user.blocked ? 'status-blocked' : 'status-active';
      const statusText = user.blocked ? 'Blocked' : 'Active';
      const roleText = user.role === 'admin' ? 'Admin' : 'User';

      tr.innerHTML = `
        <td>${escapeHTML(user.name)}</td>
        <td>${escapeHTML(user.email)}</td>
        <td>${roleText}</td>
        <td><span class="status-badge ${statusClass}">${statusText}</span></td>
        <td>
          <div class="table-actions">
            ${
              user.blocked
                ? `<button class="action-btn action-btn-primary" onclick="unblockAdminUser('${user.id}')">Unblock</button>`
                : `<button class="action-btn action-btn-primary" onclick="blockAdminUser('${user.id}')">Block</button>`
            }
            <button class="action-btn action-btn-danger" onclick="deleteAdminUser('${user.id}')">Delete</button>
          </td>
        </tr>
      `;
      tbody.appendChild(tr);
    });
  } catch (error) {
    console.error('Failed to fetch admin users:', error);
  }
}

async function fetchAdminFiles() {
  try {
    const response = await authFetch(`${API_BASE}/admin/files`);
    if (!response) return;
    const result = await response.json();
    if (!response.ok || !result.success) return;

    const tbody = document.getElementById('filesTableBody');
    tbody.innerHTML = '';

    if (!result.data || result.data.length === 0) {
      tbody.innerHTML = '<tr><td colspan="5" class="text-center">No files found.</td></tr>';
      return;
    }

    result.data.forEach((file) => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${escapeHTML(file.originalName)}</td>
        <td>${escapeHTML(file.ownerName)}</td>
        <td>${formatSize(file.fileSize)}</td>
        <td>${formatDate(file.uploadDate)}</td>
        <td>
          <div class="table-actions">
            <button class="action-btn action-btn-danger" onclick="deleteAdminFile('${file.id}')">Delete</button>
          </div>
        </td>
      `;
      tbody.appendChild(tr);
    });
  } catch (error) {
    console.error('Failed to fetch admin files:', error);
  }
}

async function blockAdminUser(userId) {
  if (!confirm('Block this user?')) return;

  try {
    const response = await authFetch(`${API_BASE}/admin/users/block/${userId}`, { method: 'PATCH' });
    if (!response) return;
    const result = await response.json();
    if (!response.ok || !result.success) {
      alert(result.message || 'Failed to block user.');
      return;
    }
    fetchAdminUsers();
    fetchAdminStats();
  } catch (error) {
    alert('Failed to block user.');
  }
}

async function unblockAdminUser(userId) {
  if (!confirm('Unblock this user?')) return;

  try {
    const response = await authFetch(`${API_BASE}/admin/users/unblock/${userId}`, { method: 'PATCH' });
    if (!response) return;
    const result = await response.json();
    if (!response.ok || !result.success) {
      alert(result.message || 'Failed to unblock user.');
      return;
    }
    fetchAdminUsers();
    fetchAdminStats();
  } catch (error) {
    alert('Failed to unblock user.');
  }
}

async function deleteAdminUser(userId) {
  if (!confirm('Delete this user and all their files? This cannot be undone.')) return;

  try {
    const response = await authFetch(`${API_BASE}/admin/users/${userId}`, { method: 'DELETE' });
    if (!response) return;
    const result = await response.json();
    if (!response.ok || !result.success) {
      alert(result.message || 'Failed to delete user.');
      return;
    }
    fetchAdminUsers();
    fetchAdminFiles();
    fetchAdminStats();
  } catch (error) {
    alert('Failed to delete user.');
  }
}

async function deleteAdminFile(fileId) {
  if (!confirm('Delete this file?')) return;

  try {
    const response = await authFetch(`${API_BASE}/admin/files/${fileId}`, { method: 'DELETE' });
    if (!response) return;
    const result = await response.json();
    if (!response.ok || !result.success) {
      alert(result.message || 'Failed to delete file.');
      return;
    }
    fetchAdminFiles();
    fetchAdminStats();
  } catch (error) {
    alert('Failed to delete file.');
  }
}

function escapeHTML(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

async function loadUserInfo() {
  try {
    const response = await authFetch(`${API_BASE}/user/me`);
    if (!response) return;
    const result = await response.json();
    if (!response.ok || !result.success) return;

    const user = result.data;
    
    // Update localStorage with latest user info
    saveSession(getToken(), user);

    // Populate user detail fields
    const userDetailName = document.getElementById('userDetailName');
    const userDetailEmail = document.getElementById('userDetailEmail');
    const userDetailPlan = document.getElementById('userDetailPlan');

    if (userDetailName) userDetailName.textContent = user.name;
    if (userDetailEmail) userDetailEmail.textContent = user.email;
    
    if (userDetailPlan) {
      userDetailPlan.textContent = user.plan === 'premium' ? 'Premium' : 'Free';
      userDetailPlan.className = user.plan === 'premium' ? 'detail-value plan-badge premium' : 'detail-value plan-badge';
    }

    // Update storage info
    updateStorageDisplay(user.usedStorageMB, user.storageLimitMB);

    // Update upgrade button
    const upgradeBtn = document.getElementById('upgradeBtn');
    if (upgradeBtn) {
      if (user.plan === 'premium') {
        upgradeBtn.textContent = '✓ Premium Plan Active';
        upgradeBtn.disabled = true;
        upgradeBtn.classList.add('premium', 'disabled');
      } else {
        upgradeBtn.disabled = false;
        upgradeBtn.classList.remove('premium', 'disabled');
      }
    }
  } catch (error) {
    console.error('Failed to load user info:', error);
  }
}

function updateStorageDisplay(usedMB, limitMB) {
  const storageBar = document.getElementById('storageBar');
  const storageText = document.getElementById('storageText');
  const storageStatus = document.getElementById('storageStatus');

  if (!storageBar || !storageText || !storageStatus) return;

  const percentage = (usedMB / limitMB) * 100;
  storageBar.style.width = Math.min(percentage, 100) + '%';
  storageText.textContent = `${usedMB.toFixed(1)} MB / ${limitMB} MB`;

  // Update bar color and status message
  storageBar.classList.remove('warning', 'danger');
  
  if (percentage >= 90) {
    storageBar.classList.add('danger');
    storageStatus.textContent = `⚠ Storage almost full! ${(limitMB - usedMB).toFixed(1)} MB remaining.`;
  } else if (percentage >= 75) {
    storageBar.classList.add('warning');
    const remainingMB = (limitMB - usedMB).toFixed(1);
    storageStatus.textContent = `You have ${remainingMB} MB remaining.`;
  } else {
    storageStatus.textContent = `You have ${(limitMB - usedMB).toFixed(1)} MB remaining.`;
  }
}

async function handleUpgrade() {
  const upgradeBtn = document.getElementById('upgradeBtn');
  if (!confirm('Upgrade to Premium plan?\n\n✓ 5,000 MB storage (50x more)\n✓ Priority file processing\n✓ Faster uploads')) {
    return;
  }

  const originalText = upgradeBtn ? upgradeBtn.textContent : 'Upgrading...';
  if (upgradeBtn) {
    upgradeBtn.disabled = true;
    upgradeBtn.textContent = 'Processing...';
  }

  try {
    const response = await authFetch(`${API_BASE}/payment/upgrade`, { method: 'POST' });
    if (!response) return;

    const result = await response.json();
    if (!response.ok || !result.success) {
      alert(result.message || 'Failed to upgrade plan.');
      return;
    }

    alert(result.message || 'Successfully upgraded to Premium! Enjoy 5GB of storage.');
    loadUserInfo();
  } catch (error) {
    alert('Failed to upgrade to Premium plan.');
    console.error('Upgrade error:', error);
  } finally {
    if (upgradeBtn) {
      upgradeBtn.disabled = false;
      upgradeBtn.textContent = originalText;
    }
  }
}

function formatSize(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}
