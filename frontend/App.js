import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Alert,
  ScrollView,
  SafeAreaView,
  StatusBar,
  Platform,
  Modal
} from 'react-native';

// API Configuration - Set according to testing environment
// For Web / Android Emulator / Physical Device:
const DEFAULT_API_BASE = Platform.select({
  android: 'http://10.0.2.2:5000',
  default: 'http://localhost:5000',
});

export default function App() {
  // Navigation / Auth State
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authToken, setAuthToken] = useState(null);
  const [apiBaseUrl, setApiBaseUrl] = useState(DEFAULT_API_BASE);

  // Login Form State
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('password123');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Dashboard Data State
  const [employees, setEmployees] = useState([]);
  const [isLoadingEmployees, setIsLoadingEmployees] = useState(false);

  // Add Employee Form State
  const [newName, setNewName] = useState('');
  const [newPosition, setNewPosition] = useState('');
  const [newSalary, setNewSalary] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  // Phase 2: Salary Clusters State
  const [clusters, setClusters] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showClusterModal, setShowClusterModal] = useState(false);

  // Delete Confirmation Modal State (guarantees cross-platform support for web and mobile)
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [employeeToDelete, setEmployeeToDelete] = useState(null);

  // ==========================================
  // Helper: Cross-platform Alert
  // ==========================================
  const showAlert = (title, message) => {
    if (Platform.OS === 'web') {
      window.alert(`${title}\n\n${message}`);
    } else {
      Alert.alert(title, message);
    }
  };

  // ==========================================
  // 1.1 Authentication (Login)
  // ==========================================
  const handleLogin = async () => {
    // Client-side validation
    if (!username.trim() || !password.trim()) {
      showAlert('Validation Error', 'Please enter both username and password.');
      return;
    }

    setIsLoggingIn(true);
    try {
      const response = await fetch(`${apiBaseUrl}/api/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: username.trim(),
          password: password.trim()
        })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setAuthToken(data.token);
        setIsAuthenticated(true);
        // Load initial employees on successful login
        fetchEmployees();
      } else {
        showAlert('Login Failed', data.message || 'Invalid username or password.');
      }
    } catch (err) {
      console.error('Login error:', err);
      showAlert(
        'Connection Error',
        `Could not connect to backend server at ${apiBaseUrl}.\nPlease ensure the backend server is running.`
      );
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setAuthToken(null);
    setEmployees([]);
    setClusters(null);
  };

  // ==========================================
  // Phase 1: CRUD Operations
  // ==========================================

  // [GET] /api/employees
  const fetchEmployees = async () => {
    setIsLoadingEmployees(true);
    try {
      const response = await fetch(`${apiBaseUrl}/api/employees`);
      if (response.ok) {
        const data = await response.json();
        setEmployees(data);
      } else {
        showAlert('Error', 'Failed to retrieve employees.');
      }
    } catch (err) {
      console.error('Fetch employees error:', err);
    } finally {
      setIsLoadingEmployees(false);
    }
  };

  // [POST] /api/employees (Add Employee)
  const handleAddEmployee = async () => {
    // Client-side validation: prevent submission if fields are empty
    if (!newName.trim() || !newPosition.trim() || !newSalary.trim()) {
      showAlert('Validation Error', 'All fields (Name, Position, Salary) are required.');
      return;
    }

    const numSalary = Number(newSalary);
    if (isNaN(numSalary) || numSalary < 0) {
      showAlert('Validation Error', 'Salary must be a valid non-negative number.');
      return;
    }

    setIsAdding(true);
    try {
      const response = await fetch(`${apiBaseUrl}/api/employees`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newName.trim(),
          position: newPosition.trim(),
          salary: numSalary
        })
      });

      if (response.ok) {
        // Reset form inputs
        setNewName('');
        setNewPosition('');
        setNewSalary('');
        // Automatically refresh list
        await fetchEmployees();
        showAlert('Success', 'Employee added successfully!');
      } else {
        const errData = await response.json();
        showAlert('Error', errData.error || 'Failed to add employee.');
      }
    } catch (err) {
      console.error('Add employee error:', err);
      showAlert('Network Error', 'Failed to connect to the server.');
    } finally {
      setIsAdding(false);
    }
  };

  // [PUT] /api/employees/:id/status (Toggle Status)
  const handleToggleStatus = async (id) => {
    try {
      const response = await fetch(`${apiBaseUrl}/api/employees/${id}/status`, {
        method: 'PUT'
      });

      if (response.ok) {
        // Automatically refresh list
        await fetchEmployees();
      } else {
        showAlert('Error', 'Failed to toggle employee status.');
      }
    } catch (err) {
      console.error('Toggle status error:', err);
      showAlert('Network Error', 'Failed to update status.');
    }
  };

  // [DELETE] /api/employees/:id (Delete Employee with Confirmation)
  const confirmDelete = (employee) => {
    setEmployeeToDelete(employee);
    // On native platform, also trigger Native Alert.alert
    if (Platform.OS !== 'web') {
      Alert.alert(
        'Confirm Deletion',
        `Are you sure you want to remove "${employee.name}" from the system?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Delete',
            style: 'destructive',
            onPress: () => executeDelete(employee.id)
          }
        ]
      );
    } else {
      // Show web modal
      setDeleteModalVisible(true);
    }
  };

  const executeDelete = async (id) => {
    setDeleteModalVisible(false);
    setEmployeeToDelete(null);
    try {
      const response = await fetch(`${apiBaseUrl}/api/employees/${id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        // Automatically refresh list
        await fetchEmployees();
        showAlert('Success', 'Employee deleted successfully.');
      } else {
        showAlert('Error', 'Failed to delete employee.');
      }
    } catch (err) {
      console.error('Delete employee error:', err);
      showAlert('Network Error', 'Failed to remove employee.');
    }
  };

  // ==========================================
  // Phase 2: K-Means Salary Clustering Analytics
  // ==========================================
  const handleAnalyzeSalaryStructure = async () => {
    setIsAnalyzing(true);
    setShowClusterModal(true);
    try {
      const response = await fetch(`${apiBaseUrl}/api/employees/salary-clusters`);
      if (response.ok) {
        const data = await response.json();
        setClusters(data.clusters || []);
      } else {
        showAlert('Error', 'Failed to compute salary clusters.');
      }
    } catch (err) {
      console.error('Analytics error:', err);
      showAlert('Network Error', 'Failed to fetch cluster analytics.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  // ==========================================
  // Screen: LOGIN
  // ==========================================
  if (!isAuthenticated) {
    return (
      <SafeAreaView style={styles.safeContainer}>
        <StatusBar barStyle="dark-content" backgroundColor="#f3f4f6" />
        <View style={styles.loginContainer}>
          <View style={styles.loginCard}>
            <Text style={styles.loginTitle}>HR Manager & Analytics</Text>
            <Text style={styles.loginSubtitle}>Internet Programming Final Exam 2026</Text>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Username</Text>
              <TextInput
                style={styles.input}
                value={username}
                onChangeText={setUsername}
                placeholder="Enter username (admin)"
                autoCapitalize="none"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Password</Text>
              <TextInput
                style={styles.input}
                value={password}
                onChangeText={setPassword}
                placeholder="Enter password (password123)"
                secureTextEntry
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>API Server URL</Text>
              <TextInput
                style={styles.inputSmall}
                value={apiBaseUrl}
                onChangeText={setApiBaseUrl}
                placeholder="http://localhost:5000"
                autoCapitalize="none"
              />
            </View>

            <TouchableOpacity
              style={styles.primaryButton}
              onPress={handleLogin}
              disabled={isLoggingIn}
            >
              {isLoggingIn ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <Text style={styles.primaryButtonText}>Sign In</Text>
              )}
            </TouchableOpacity>

            <View style={styles.credentialHint}>
              <Text style={styles.hintTitle}>Default Credentials:</Text>
              <Text style={styles.hintText}>Username: <Text style={styles.boldText}>admin</Text></Text>
              <Text style={styles.hintText}>Password: <Text style={styles.boldText}>password123</Text></Text>
            </View>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  // ==========================================
  // Screen: DASHBOARD
  // ==========================================
  return (
    <SafeAreaView style={styles.safeContainer}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />

      {/* Top Navbar */}
      <View style={styles.navbar}>
        <View>
          <Text style={styles.navTitle}>HR Manager</Text>
          <Text style={styles.navSubtitle}>Std6730251468 • Final Exam</Text>
        </View>
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutButtonText}>Logout</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.dashboardContent} contentContainerStyle={{ paddingBottom: 40 }}>
        {/* Phase 2 Analytics Trigger Banner */}
        <View style={styles.analyticsBanner}>
          <View style={{ flex: 1 }}>
            <Text style={styles.bannerTitle}>🧠 Salary Structure Analytics</Text>
            <Text style={styles.bannerDesc}>
              1D K-Means Clustering (k=3) groups employee salaries into distinct tiers.
            </Text>
          </View>
          <TouchableOpacity
            style={styles.analyzeButton}
            onPress={handleAnalyzeSalaryStructure}
          >
            <Text style={styles.analyzeButtonText}>Analyze Salary Structure</Text>
          </TouchableOpacity>
        </View>

        {/* Phase 1: Add Employee Form */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>➕ Add New Employee</Text>
          <Text style={styles.cardSubtitle}>Fill in all fields to register an employee record.</Text>

          <View style={styles.formRow}>
            <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
              <Text style={styles.label}>Full Name *</Text>
              <TextInput
                style={styles.input}
                value={newName}
                onChangeText={setNewName}
                placeholder="e.g. Somchai Jaidee"
              />
            </View>

            <View style={[styles.inputGroup, { flex: 1 }]}>
              <Text style={styles.label}>Position *</Text>
              <TextInput
                style={styles.input}
                value={newPosition}
                onChangeText={setNewPosition}
                placeholder="e.g. Software Engineer"
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Salary (THB) *</Text>
            <TextInput
              style={styles.input}
              value={newSalary}
              onChangeText={setNewSalary}
              placeholder="e.g. 45000"
              keyboardType="numeric"
            />
          </View>

          <TouchableOpacity
            style={[styles.primaryButton, { marginTop: 4 }]}
            onPress={handleAddEmployee}
            disabled={isAdding}
          >
            {isAdding ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text style={styles.primaryButtonText}>Add Employee</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Phase 1: Employee List */}
        <View style={styles.card}>
          <View style={styles.listHeader}>
            <Text style={styles.cardTitle}>👥 Employee Directory ({employees.length})</Text>
            <TouchableOpacity onPress={fetchEmployees} style={styles.refreshBadge}>
              <Text style={styles.refreshText}>🔄 Refresh</Text>
            </TouchableOpacity>
          </View>

          {isLoadingEmployees ? (
            <View style={styles.loadingBox}>
              <ActivityIndicator size="large" color="#2563eb" />
              <Text style={styles.loadingText}>Loading employee records...</Text>
            </View>
          ) : employees.length === 0 ? (
            <Text style={styles.emptyText}>No employees registered yet.</Text>
          ) : (
            employees.map((item) => (
              <View key={item.id} style={styles.employeeItem}>
                <View style={styles.empInfo}>
                  <View style={styles.empNameRow}>
                    <Text style={styles.empName}>{item.name}</Text>
                    <View
                      style={[
                        styles.statusBadge,
                        item.status === 'Active' ? styles.statusActive : styles.statusLeave
                      ]}
                    >
                      <Text
                        style={[
                          styles.statusBadgeText,
                          item.status === 'Active' ? styles.textActive : styles.textLeave
                        ]}
                      >
                        {item.status}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.empPosition}>{item.position}</Text>
                  <Text style={styles.empSalary}>
                    Salary: <Text style={styles.salaryHighlight}>฿{Number(item.salary).toLocaleString()}</Text>
                  </Text>
                </View>

                {/* Actions: Toggle Status & Delete */}
                <View style={styles.actionButtonsRow}>
                  <TouchableOpacity
                    style={styles.toggleButton}
                    onPress={() => handleToggleStatus(item.id)}
                  >
                    <Text style={styles.toggleButtonText}>Toggle Status</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.deleteButton}
                    onPress={() => confirmDelete(item)}
                  >
                    <Text style={styles.deleteButtonText}>Delete</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )}
        </View>
      </ScrollView>

      {/* ========================================== */}
      {/* Phase 2: K-Means Salary Clusters Modal     */}
      {/* ========================================== */}
      <Modal
        visible={showClusterModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowClusterModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>📊 Salary Structure Analysis</Text>
              <TouchableOpacity onPress={() => setShowClusterModal(false)}>
                <Text style={styles.closeModalText}>✕</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.modalSubtitle}>
              K-Means Clustering (k=3) groups the company's salary structure into 3 distinct tiers.
            </Text>

            {isAnalyzing ? (
              <View style={styles.analyzingBox}>
                <ActivityIndicator size="large" color="#2563eb" />
                <Text style={styles.analyzingText}>Calculating K-Means centroids...</Text>
              </View>
            ) : clusters && clusters.length > 0 ? (
              <ScrollView style={{ maxHeight: 380 }}>
                {clusters.map((cluster, idx) => (
                  <View
                    key={idx}
                    style={[
                      styles.clusterCard,
                      idx === 0
                        ? styles.tier1Border
                        : idx === 1
                        ? styles.tier2Border
                        : styles.tier3Border
                    ]}
                  >
                    <View style={styles.clusterCardHeader}>
                      <Text style={styles.clusterTierName}>{cluster.group}</Text>
                      <View style={styles.clusterCountPill}>
                        <Text style={styles.clusterCountText}>{cluster.count} Employees</Text>
                      </View>
                    </View>
                    <Text style={styles.centroidLabel}>Average Base Salary (Centroid):</Text>
                    <Text style={styles.centroidValue}>
                      ฿{Number(cluster.centroid).toLocaleString()}
                    </Text>
                  </View>
                ))}
              </ScrollView>
            ) : (
              <Text style={styles.emptyText}>No salary data available to cluster.</Text>
            )}

            <TouchableOpacity
              style={[styles.primaryButton, { marginTop: 16 }]}
              onPress={() => setShowClusterModal(false)}
            >
              <Text style={styles.primaryButtonText}>Close Analytics</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ========================================== */}
      {/* Delete Confirmation Dialog (Web Fallback) */}
      {/* ========================================== */}
      <Modal
        visible={deleteModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setDeleteModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.deleteConfirmBox}>
            <Text style={styles.deleteConfirmTitle}>⚠️ Confirm Deletion</Text>
            <Text style={styles.deleteConfirmMessage}>
              Are you sure you want to delete employee "{employeeToDelete?.name}"? This action cannot be undone.
            </Text>

            <View style={styles.deleteConfirmActions}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => {
                  setDeleteModalVisible(false);
                  setEmployeeToDelete(null);
                }}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.confirmDeleteButton}
                onPress={() => employeeToDelete && executeDelete(employeeToDelete.id)}
              >
                <Text style={styles.confirmDeleteButtonText}>Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeContainer: {
    flex: 1,
    backgroundColor: '#f3f4f6',
  },
  // Login Styles
  loginContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  loginCard: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  loginTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
    textAlign: 'center',
  },
  loginSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 20,
  },
  inputGroup: {
    marginBottom: 12,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 6,
  },
  input: {
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#111827',
  },
  inputSmall: {
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    fontSize: 12,
    color: '#4b5563',
  },
  primaryButton: {
    backgroundColor: '#2563eb',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  primaryButtonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: 'bold',
  },
  credentialHint: {
    marginTop: 20,
    padding: 12,
    backgroundColor: '#eff6ff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#bfdbfe',
  },
  hintTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#1e40af',
    marginBottom: 4,
  },
  hintText: {
    fontSize: 12,
    color: '#1e3a8a',
  },
  boldText: {
    fontWeight: 'bold',
  },

  // Navbar Styles
  navbar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  navTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
  },
  navSubtitle: {
    fontSize: 12,
    color: '#6b7280',
  },
  logoutButton: {
    backgroundColor: '#fee2e2',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  logoutButtonText: {
    color: '#dc2626',
    fontWeight: '600',
    fontSize: 13,
  },

  // Dashboard Styles
  dashboardContent: {
    padding: 16,
  },
  analyticsBanner: {
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 12,
  },
  bannerTitle: {
    color: '#f8fafc',
    fontSize: 16,
    fontWeight: 'bold',
  },
  bannerDesc: {
    color: '#94a3b8',
    fontSize: 12,
    marginTop: 2,
  },
  analyzeButton: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 8,
  },
  analyzeButtonText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 13,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111827',
  },
  cardSubtitle: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
    marginBottom: 12,
  },
  formRow: {
    flexDirection: 'row',
  },
  listHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  refreshBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: '#f3f4f6',
    borderRadius: 6,
  },
  refreshText: {
    fontSize: 12,
    color: '#374151',
  },
  loadingBox: {
    padding: 24,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 8,
    fontSize: 13,
    color: '#6b7280',
  },
  emptyText: {
    textAlign: 'center',
    color: '#9ca3af',
    paddingVertical: 20,
    fontSize: 14,
  },

  // Employee Item
  employeeItem: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    padding: 12,
    marginBottom: 10,
    backgroundColor: '#fafafa',
  },
  empInfo: {
    marginBottom: 8,
  },
  empNameRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  empName: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#111827',
  },
  empPosition: {
    fontSize: 13,
    color: '#4b5563',
    marginTop: 2,
  },
  empSalary: {
    fontSize: 13,
    color: '#6b7280',
    marginTop: 2,
  },
  salaryHighlight: {
    fontWeight: 'bold',
    color: '#059669',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  statusActive: {
    backgroundColor: '#d1fae5',
  },
  statusLeave: {
    backgroundColor: '#fef3c7',
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  textActive: {
    color: '#065f46',
  },
  textLeave: {
    color: '#92400e',
  },
  actionButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
    paddingTop: 8,
  },
  toggleButton: {
    backgroundColor: '#e0e7ff',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
  },
  toggleButtonText: {
    color: '#3730a3',
    fontSize: 12,
    fontWeight: '600',
  },
  deleteButton: {
    backgroundColor: '#fee2e2',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
  },
  deleteButtonText: {
    color: '#b91c1c',
    fontSize: 12,
    fontWeight: '600',
  },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    width: '100%',
    maxWidth: 480,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
  },
  modalSubtitle: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 16,
  },
  closeModalText: {
    fontSize: 18,
    color: '#9ca3af',
    fontWeight: 'bold',
    padding: 4,
  },
  analyzingBox: {
    padding: 30,
    alignItems: 'center',
  },
  analyzingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#4b5563',
  },
  clusterCard: {
    backgroundColor: '#f8fafc',
    borderRadius: 10,
    padding: 14,
    marginBottom: 10,
    borderLeftWidth: 5,
  },
  tier1Border: {
    borderLeftColor: '#3b82f6',
  },
  tier2Border: {
    borderLeftColor: '#10b981',
  },
  tier3Border: {
    borderLeftColor: '#8b5cf6',
  },
  clusterCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  clusterTierName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  clusterCountPill: {
    backgroundColor: '#e2e8f0',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  clusterCountText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#334155',
  },
  centroidLabel: {
    fontSize: 12,
    color: '#64748b',
  },
  centroidValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#0f172a',
    marginTop: 2,
  },

  // Delete Confirm Box
  deleteConfirmBox: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 20,
    width: '100%',
    maxWidth: 360,
  },
  deleteConfirmTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#dc2626',
    marginBottom: 8,
  },
  deleteConfirmMessage: {
    fontSize: 14,
    color: '#374151',
    marginBottom: 16,
    lineHeight: 20,
  },
  deleteConfirmActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
  },
  cancelButton: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 6,
    backgroundColor: '#f3f4f6',
  },
  cancelButtonText: {
    color: '#4b5563',
    fontWeight: '600',
  },
  confirmDeleteButton: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 6,
    backgroundColor: '#dc2626',
  },
  confirmDeleteButtonText: {
    color: '#ffffff',
    fontWeight: 'bold',
  },
});
