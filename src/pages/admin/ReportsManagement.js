import React, { useState } from 'react';
import { useQuery } from 'react-query';
import { API_BASE_URL } from '../../config/api';
import { 
  Download, 
  FileText, 
  Building2,
  Users,
  Folder,
  FileDown
} from 'lucide-react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import { adminAPI, usersAPI, investmentsAPI, walletTransactionsAPI } from '../../services/api';
import { useAdminAuth } from '../../components/admin/AdminAuth';

// Import jsPDF
import { jsPDF } from 'jspdf';

const ReportsManagement = () => {
  const { isAuthenticated } = useAdminAuth();
  
  const [reportType, setReportType] = useState(''); // 'property', 'organization', 'user'
  const [selectedProperty, setSelectedProperty] = useState('');
  const [selectedOrganization, setSelectedOrganization] = useState('');
  const [selectedUser, setSelectedUser] = useState('');

  // Fetch all properties
  const { data: propertiesData } = useQuery(
    ['all-properties-for-reports'],
    () => adminAPI.getProperties({ limit: 1000 }),
    {
      enabled: isAuthenticated && (reportType === 'property' || !reportType)
    }
  );

  // Fetch all organizations
  const { data: organizationsData } = useQuery(
    ['all-organizations-for-reports'],
    () => adminAPI.getOrganizations({ limit: 1000 }),
    {
      enabled: isAuthenticated && (reportType === 'organization' || !reportType)
    }
  );

  // Fetch all users
  const { data: usersData } = useQuery(
    ['all-users-for-reports'],
    () => adminAPI.getUsers({ limit: 1000 }),
    {
      enabled: isAuthenticated && (reportType === 'user' || !reportType)
    }
  );

  const properties = propertiesData?.data?.data?.properties || 
                    propertiesData?.data?.properties || 
                    propertiesData?.data || 
                    (Array.isArray(propertiesData) ? propertiesData : []);

  const organizations = organizationsData?.data?.data?.organizations || 
                       organizationsData?.data?.organizations || 
                       organizationsData?.data || 
                       (Array.isArray(organizationsData) ? organizationsData : []);

  const users = usersData?.data?.data?.users || 
               usersData?.data?.users || 
               usersData?.data || 
               (Array.isArray(usersData) ? usersData : []);

  // Fetch detailed data for selected entity
  const { data: propertyDetails } = useQuery(
    ['property-details', selectedProperty],
    async () => {
      if (!selectedProperty) return null;
      const property = properties.find(p => (p.id === selectedProperty) || (p.displayCode === selectedProperty));
      if (!property) return null;

      // Fetch investments for this property
      const investmentsResponse = await investmentsAPI.getAll();
      const allInvestments = investmentsResponse?.data?.data || investmentsResponse?.data || [];
      const propertyInvestments = allInvestments.filter(inv => 
        (inv.propertyId === property.id || inv.propertyId === property.displayCode) ||
        (inv.property?.id === property.id || inv.property?.displayCode === property.displayCode)
      );

      return {
        property,
        investments: propertyInvestments
      };
    },
    {
      enabled: isAuthenticated && reportType === 'property' && !!selectedProperty
    }
  );

  const { data: organizationDetails } = useQuery(
    ['organization-details', selectedOrganization],
    async () => {
      if (!selectedOrganization) return null;
      const org = organizations.find(o => (o.id === selectedOrganization) || (o.displayCode === selectedOrganization));
      if (!org) return null;

      // Fetch properties for this organization
      const propertiesResponse = await adminAPI.getProperties({ limit: 1000 });
      const allProperties = propertiesResponse?.data?.data?.properties || propertiesResponse?.data?.properties || [];
      const orgProperties = allProperties.filter(prop => 
        prop.organizationId === org.id || prop.organizationId === org.displayCode ||
        prop.organization?.id === org.id || prop.organization?.displayCode === org.displayCode
      );

      // Fetch investments for org properties
      const investmentsResponse = await investmentsAPI.getAll();
      const allInvestments = investmentsResponse?.data?.data || investmentsResponse?.data || [];
      const orgInvestments = allInvestments.filter(inv => {
        const invPropertyId = inv.propertyId || inv.property?.id || inv.property?.displayCode;
        return orgProperties.some(prop => 
          (prop.id === invPropertyId || prop.displayCode === invPropertyId)
        );
      });

      return {
        organization: org,
        properties: orgProperties,
        investments: orgInvestments
      };
    },
    {
      enabled: isAuthenticated && reportType === 'organization' && !!selectedOrganization
    }
  );

  const { data: userDetails } = useQuery(
    ['user-details', selectedUser],
    async () => {
      if (!selectedUser) return null;
      const user = users.find(u => (u.id === selectedUser) || (u.displayCode === selectedUser));
      if (!user) return null;

      const userId = user.id || user.displayCode;

      // Fetch user's wallet, investments, and transactions
      const [walletResponse, portfolioResponse, transactionsResponse] = await Promise.allSettled([
        usersAPI.getWalletById(userId).catch(() => ({ data: null })),
        fetch(`${API_BASE_URL}/portfolio/user/${userId}/detailed`)
          .then(r => r.json())
          .catch(() => null),
        walletTransactionsAPI.getByUserId(userId).catch(() => ({ data: [] }))
      ]);

      const walletData = walletResponse.status === 'fulfilled' ? walletResponse.value?.data : null;
      const portfolioData = portfolioResponse.status === 'fulfilled' ? portfolioResponse.value : null;
      const transactionsData = transactionsResponse.status === 'fulfilled' ? transactionsResponse.value?.data : [];

      return {
        user,
        wallet: walletData,
        portfolio: portfolioData,
        transactions: Array.isArray(transactionsData) ? transactionsData : transactionsData?.data || []
      };
    },
    {
      enabled: isAuthenticated && reportType === 'user' && !!selectedUser
    }
  );

  const generatePropertyPDF = () => {
    if (!propertyDetails) return;

    const { property, investments } = propertyDetails;
    const doc = new jsPDF();
    
    // Helper function to draw colored header
    const drawHeader = (title, y) => {
      doc.setFillColor(17, 117, 197); // Blue color
      doc.rect(14, y - 5, 182, 8, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(16);
      doc.setFont(undefined, 'bold');
      doc.text(title, 105, y, { align: 'center' });
      doc.setTextColor(0, 0, 0);
      doc.setFont(undefined, 'normal');
      return y + 10;
    };

    // Helper function to draw table row
    const drawTableRow = (label, value, y, isAlternate = false) => {
      if (isAlternate) {
        doc.setFillColor(245, 247, 250);
        doc.rect(14, y - 4, 182, 7, 'F');
      }
      doc.setDrawColor(200, 200, 200);
      doc.rect(14, y - 4, 182, 7);
      doc.setTextColor(60, 60, 60);
      doc.setFontSize(10);
      doc.setFont(undefined, 'bold');
      doc.text(label, 18, y);
      doc.setFont(undefined, 'normal');
      doc.setTextColor(0, 0, 0);
      doc.text(value, 100, y);
      return y + 7;
    };

    // Helper function to draw section header
    const drawSectionHeader = (title, y) => {
      doc.setFillColor(240, 242, 247);
      doc.rect(14, y - 4, 182, 7, 'F');
      doc.setDrawColor(200, 200, 200);
      doc.rect(14, y - 4, 182, 7);
      doc.setTextColor(17, 117, 197);
      doc.setFontSize(12);
      doc.setFont(undefined, 'bold');
      doc.text(title, 18, y);
      doc.setTextColor(0, 0, 0);
      doc.setFont(undefined, 'normal');
      return y + 7;
    };

    let yPos = 20;

    // Main Header
    yPos = drawHeader('Property Report', yPos);
    yPos += 5;

    // Property Information Section
    yPos = drawSectionHeader('Property Information', yPos);
    yPos += 2;

    const totalValue = parseFloat(property.pricing_total_value || property.totalValueUSDT || property.purchasePriceUSDT || 0);
    const expectedROI = parseFloat(property.pricing_expected_roi || property.expectedROI || 0);
    const totalTokens = parseFloat(property.tokenization_total_tokens || property.totalTokens || 0);
    const availableTokens = parseFloat(property.tokenization_available_tokens || property.availableTokens || 0);
    const boughtTokens = totalTokens - availableTokens;
    const fundingPercentage = totalTokens > 0 ? (boughtTokens / totalTokens) * 100 : 0;

    yPos = drawTableRow('Property Name', property.title || 'N/A', yPos, false);
    yPos = drawTableRow('Display Code', property.displayCode || property.id || 'N/A', yPos, true);
    yPos = drawTableRow('Location', property.location_city || property.city || 'N/A', yPos, false);
    yPos = drawTableRow('Type', (property.property_type || property.propertyType || property.type || 'N/A').toUpperCase(), yPos, true);
    
    // Status
    const status = property.status || 'N/A';
    yPos = drawTableRow('Status', status.toUpperCase(), yPos, false);
    
    yPos = drawTableRow('Total Value', `$${totalValue.toLocaleString()}`, yPos, true);
    yPos = drawTableRow('Expected ROI', `${expectedROI}%`, yPos, false);
    yPos = drawTableRow('Total Tokens', totalTokens.toLocaleString(), yPos, true);
    yPos = drawTableRow('Bought Tokens', boughtTokens.toLocaleString(), yPos, false);
    yPos = drawTableRow('Available Tokens', availableTokens.toLocaleString(), yPos, true);
    
    // Funding progress with color bar
    const progressWidth = (fundingPercentage / 100) * 120;
    doc.setFillColor(34, 197, 94);
    doc.rect(100, yPos - 4, progressWidth, 5, 'F');
    doc.setDrawColor(200, 200, 200);
    doc.rect(100, yPos - 4, 120, 5);
    yPos = drawTableRow('Funding Progress', `${fundingPercentage.toFixed(2)}%`, yPos, false);
    yPos += 5;

    // Investments Table
    if (investments && investments.length > 0) {
      if (yPos > 250) {
        doc.addPage();
        yPos = 20;
      }

      yPos = drawSectionHeader('Investment Details', yPos);
      yPos += 2;

      // Table Header
      doc.setFillColor(17, 117, 197);
      doc.rect(14, yPos - 4, 182, 7, 'F');
      doc.setDrawColor(200, 200, 200);
      doc.rect(14, yPos - 4, 182, 7);
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(9);
      doc.setFont(undefined, 'bold');
      doc.text('#', 18, yPos);
      doc.text('Investor', 30, yPos);
      doc.text('Amount', 100, yPos);
      doc.text('Tokens', 140, yPos);
      doc.text('Status', 170, yPos);
      doc.setTextColor(0, 0, 0);
      doc.setFont(undefined, 'normal');
      yPos += 7;

      // Table Rows
      investments.slice(0, 20).forEach((inv, index) => {
        if (yPos > 280) {
          doc.addPage();
          yPos = 20;
          // Redraw header
          doc.setFillColor(17, 117, 197);
          doc.rect(14, yPos - 4, 182, 7, 'F');
          doc.setDrawColor(200, 200, 200);
          doc.rect(14, yPos - 4, 182, 7);
          doc.setTextColor(255, 255, 255);
          doc.setFontSize(9);
          doc.setFont(undefined, 'bold');
          doc.text('#', 18, yPos);
          doc.text('Investor', 30, yPos);
          doc.text('Amount', 100, yPos);
          doc.text('Tokens', 140, yPos);
          doc.text('Status', 170, yPos);
          doc.setTextColor(0, 0, 0);
          doc.setFont(undefined, 'normal');
          yPos += 7;
        }

        const isAlternate = index % 2 === 1;
        if (isAlternate) {
          doc.setFillColor(245, 247, 250);
          doc.rect(14, yPos - 4, 182, 7, 'F');
        }
        doc.setDrawColor(200, 200, 200);
        doc.rect(14, yPos - 4, 182, 7);

        const amount = parseFloat(inv.amountUSDT || inv.amount || 0);
        const tokens = parseFloat(inv.tokensPurchased || inv.tokens || 0);
        const status = inv.status || 'N/A';

        doc.setFontSize(9);
        doc.text(String(index + 1), 18, yPos);
        doc.text((inv.user?.fullName || inv.userName || 'N/A').substring(0, 20), 30, yPos);
        doc.text(`$${amount.toLocaleString()}`, 100, yPos);
        doc.text(tokens.toLocaleString(), 140, yPos);
        doc.text(status.toUpperCase(), 170, yPos);
        
        yPos += 7;
      });

      if (investments.length > 20) {
        doc.setFontSize(9);
        doc.setTextColor(100, 100, 100);
        doc.text(`... and ${investments.length - 20} more investments`, 18, yPos);
        doc.setTextColor(0, 0, 0);
      }
    }

    // Footer
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFillColor(240, 242, 247);
      doc.rect(14, 285, 182, 10, 'F');
      doc.setFontSize(8);
      doc.setTextColor(100, 100, 100);
      doc.text(`Page ${i} of ${pageCount}`, 105, 290, { align: 'center' });
      doc.text(`Generated on ${new Date().toLocaleDateString()}`, 105, 295, { align: 'center' });
    }

    doc.save(`Property_Report_${property.displayCode || property.id}_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  const generateOrganizationPDF = () => {
    if (!organizationDetails) return;

    const { organization, properties, investments } = organizationDetails;
    const doc = new jsPDF();
    
    // Helper functions (same as property PDF)
    const drawHeader = (title, y) => {
      doc.setFillColor(17, 117, 197);
      doc.rect(14, y - 5, 182, 8, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(16);
      doc.setFont(undefined, 'bold');
      doc.text(title, 105, y, { align: 'center' });
      doc.setTextColor(0, 0, 0);
      doc.setFont(undefined, 'normal');
      return y + 10;
    };

    const drawTableRow = (label, value, y, isAlternate = false) => {
      if (isAlternate) {
        doc.setFillColor(245, 247, 250);
        doc.rect(14, y - 4, 182, 7, 'F');
      }
      doc.setDrawColor(200, 200, 200);
      doc.rect(14, y - 4, 182, 7);
      doc.setTextColor(60, 60, 60);
      doc.setFontSize(10);
      doc.setFont(undefined, 'bold');
      doc.text(label, 18, y);
      doc.setFont(undefined, 'normal');
      doc.setTextColor(0, 0, 0);
      doc.text(value, 100, y);
      return y + 7;
    };

    const drawSectionHeader = (title, y) => {
      doc.setFillColor(240, 242, 247);
      doc.rect(14, y - 4, 182, 7, 'F');
      doc.setDrawColor(200, 200, 200);
      doc.rect(14, y - 4, 182, 7);
      doc.setTextColor(17, 117, 197);
      doc.setFontSize(12);
      doc.setFont(undefined, 'bold');
      doc.text(title, 18, y);
      doc.setTextColor(0, 0, 0);
      doc.setFont(undefined, 'normal');
      return y + 7;
    };

    let yPos = 20;

    // Main Header
    yPos = drawHeader('Organization Report', yPos);
    yPos += 5;

    // Organization Information
    yPos = drawSectionHeader('Organization Information', yPos);
    yPos += 2;

    const orgStatus = organization.status || (organization.isActive ? 'Active' : 'Inactive');

    yPos = drawTableRow('Organization Name', organization.name || 'N/A', yPos, false);
    yPos = drawTableRow('Display Code', organization.displayCode || organization.id || 'N/A', yPos, true);
    yPos = drawTableRow('Email', organization.email || 'N/A', yPos, false);
    yPos = drawTableRow('Phone', organization.phone || 'N/A', yPos, true);
    yPos = drawTableRow('Status', orgStatus.toUpperCase(), yPos, false);
    yPos += 5;

    // Summary Statistics
    yPos = drawSectionHeader('Summary Statistics', yPos);
    yPos += 2;

    const totalInvestment = investments.reduce((sum, inv) => {
      return sum + parseFloat(inv.amountUSDT || inv.amount || 0);
    }, 0);

    yPos = drawTableRow('Total Properties', String(properties.length), yPos, false);
    yPos = drawTableRow('Total Investments', String(investments.length), yPos, true);
    yPos = drawTableRow('Total Investment Volume', `$${totalInvestment.toLocaleString()}`, yPos, false);
    yPos += 5;

    // Properties Table
    if (properties.length > 0) {
      if (yPos > 250) {
        doc.addPage();
        yPos = 20;
      }

      yPos = drawSectionHeader('Properties List', yPos);
      yPos += 2;

      // Table Header
      doc.setFillColor(17, 117, 197);
      doc.rect(14, yPos - 4, 182, 7, 'F');
      doc.setDrawColor(200, 200, 200);
      doc.rect(14, yPos - 4, 182, 7);
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(9);
      doc.setFont(undefined, 'bold');
      doc.text('#', 18, yPos);
      doc.text('Property Name', 30, yPos);
      doc.text('Code', 110, yPos);
      doc.text('Status', 150, yPos);
      doc.text('Location', 170, yPos);
      doc.setTextColor(0, 0, 0);
      doc.setFont(undefined, 'normal');
      yPos += 7;

      properties.slice(0, 20).forEach((prop, index) => {
        if (yPos > 280) {
          doc.addPage();
          yPos = 20;
          // Redraw header
          doc.setFillColor(17, 117, 197);
          doc.rect(14, yPos - 4, 182, 7, 'F');
          doc.setDrawColor(200, 200, 200);
          doc.rect(14, yPos - 4, 182, 7);
          doc.setTextColor(255, 255, 255);
          doc.setFontSize(9);
          doc.setFont(undefined, 'bold');
          doc.text('#', 18, yPos);
          doc.text('Property Name', 30, yPos);
          doc.text('Code', 110, yPos);
          doc.text('Status', 150, yPos);
          doc.text('Location', 170, yPos);
          doc.setTextColor(0, 0, 0);
          doc.setFont(undefined, 'normal');
          yPos += 7;
        }

        const isAlternate = index % 2 === 1;
        if (isAlternate) {
          doc.setFillColor(245, 247, 250);
          doc.rect(14, yPos - 4, 182, 7, 'F');
        }
        doc.setDrawColor(200, 200, 200);
        doc.rect(14, yPos - 4, 182, 7);

        const propStatus = prop.status || 'N/A';

        doc.setFontSize(9);
        doc.text(String(index + 1), 18, yPos);
        doc.text((prop.title || 'N/A').substring(0, 25), 30, yPos);
        doc.text((prop.displayCode || prop.id || 'N/A').substring(0, 12), 110, yPos);
        doc.text(propStatus.toUpperCase().substring(0, 10), 150, yPos);
        doc.text((prop.location_city || prop.city || 'N/A').substring(0, 10), 170, yPos);
        
        yPos += 7;
      });

      if (properties.length > 20) {
        doc.setFontSize(9);
        doc.setTextColor(100, 100, 100);
        doc.text(`... and ${properties.length - 20} more properties`, 18, yPos);
        doc.setTextColor(0, 0, 0);
      }
    }

    // Footer
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFillColor(240, 242, 247);
      doc.rect(14, 285, 182, 10, 'F');
      doc.setFontSize(8);
      doc.setTextColor(100, 100, 100);
      doc.text(`Page ${i} of ${pageCount}`, 105, 290, { align: 'center' });
      doc.text(`Generated on ${new Date().toLocaleDateString()}`, 105, 295, { align: 'center' });
    }

    doc.save(`Organization_Report_${organization.displayCode || organization.id}_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  const generateUserPDF = () => {
    if (!userDetails) return;

    const { user, wallet, portfolio, transactions } = userDetails;
    const doc = new jsPDF();
    
    // Helper functions
    const drawHeader = (title, y) => {
      doc.setFillColor(17, 117, 197);
      doc.rect(14, y - 5, 182, 8, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(16);
      doc.setFont(undefined, 'bold');
      doc.text(title, 105, y, { align: 'center' });
      doc.setTextColor(0, 0, 0);
      doc.setFont(undefined, 'normal');
      return y + 10;
    };

    const drawTableRow = (label, value, y, isAlternate = false) => {
      if (isAlternate) {
        doc.setFillColor(245, 247, 250);
        doc.rect(14, y - 4, 182, 7, 'F');
      }
      doc.setDrawColor(200, 200, 200);
      doc.rect(14, y - 4, 182, 7);
      doc.setTextColor(60, 60, 60);
      doc.setFontSize(10);
      doc.setFont(undefined, 'bold');
      doc.text(label, 18, y);
      doc.setFont(undefined, 'normal');
      doc.setTextColor(0, 0, 0);
      doc.text(value, 100, y);
      return y + 7;
    };

    const drawSectionHeader = (title, y) => {
      doc.setFillColor(240, 242, 247);
      doc.rect(14, y - 4, 182, 7, 'F');
      doc.setDrawColor(200, 200, 200);
      doc.rect(14, y - 4, 182, 7);
      doc.setTextColor(17, 117, 197);
      doc.setFontSize(12);
      doc.setFont(undefined, 'bold');
      doc.text(title, 18, y);
      doc.setTextColor(0, 0, 0);
      doc.setFont(undefined, 'normal');
      return y + 7;
    };

    let yPos = 20;

    // Main Header
    yPos = drawHeader('User Report', yPos);
    yPos += 5;

    // User Information
    yPos = drawSectionHeader('User Information', yPos);
    yPos += 2;

    const userStatus = user.isActive !== undefined ? (user.isActive ? 'Active' : 'Inactive') : (user.is_active ? 'Active' : 'Inactive');

    yPos = drawTableRow('Full Name', user.fullName || user.name || 'N/A', yPos, false);
    yPos = drawTableRow('Display Code', user.displayCode || user.id || 'N/A', yPos, true);
    yPos = drawTableRow('Email', user.email || 'N/A', yPos, false);
    yPos = drawTableRow('Phone', user.phone || 'N/A', yPos, true);
    yPos = drawTableRow('Status', userStatus.toUpperCase(), yPos, false);
    yPos = drawTableRow('Joined Date', user.createdAt || user.created_at ? new Date(user.createdAt || user.created_at).toLocaleDateString() : 'N/A', yPos, true);
    yPos += 5;

    // Financial Summary
    if (wallet || portfolio) {
      yPos = drawSectionHeader('Financial Summary', yPos);
      yPos += 2;

      const walletBalance = parseFloat(wallet?.balanceUSDT || wallet?.data?.balanceUSDT || wallet?.balance || 0);
      yPos = drawTableRow('Wallet Balance', `$${walletBalance.toLocaleString()}`, yPos, false);

      if (portfolio) {
        const summary = portfolio.summary || {};
        const totalInvested = parseFloat(summary.totalInvestedUSDT || 0);
        const totalReturns = parseFloat(summary.totalRewardsUSDT || 0);
        const currentValue = parseFloat(summary.totalCurrentValueUSDT || 0);
        const netROI = parseFloat(summary.totalNetROI || 0);
        const avgROI = parseFloat(summary.averageROI || 0);
        const activeInvestments = parseInt(summary.activeInvestments || 0);

        yPos = drawTableRow('Total Investments', `$${totalInvested.toLocaleString()}`, yPos, true);
        yPos = drawTableRow('Total Returns', `$${totalReturns.toLocaleString()}`, yPos, false);
        yPos = drawTableRow('Current Value', `$${currentValue.toLocaleString()}`, yPos, true);
        yPos = drawTableRow('Net ROI', `$${netROI.toLocaleString()}`, yPos, false);
        
        yPos = drawTableRow('Average ROI', `${avgROI.toFixed(2)}%`, yPos, true);
        yPos = drawTableRow('Active Investments', String(activeInvestments), yPos, false);
      }
      yPos += 5;
    }

    // Investments Table
    if (portfolio?.investments && portfolio.investments.length > 0) {
      if (yPos > 250) {
        doc.addPage();
        yPos = 20;
      }

      yPos = drawSectionHeader('Investment Portfolio', yPos);
      yPos += 2;

      // Table Header
      doc.setFillColor(17, 117, 197);
      doc.rect(14, yPos - 4, 182, 7, 'F');
      doc.setDrawColor(200, 200, 200);
      doc.rect(14, yPos - 4, 182, 7);
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(9);
      doc.setFont(undefined, 'bold');
      doc.text('#', 18, yPos);
      doc.text('Property', 30, yPos);
      doc.text('Amount', 110, yPos);
      doc.text('Tokens', 150, yPos);
      doc.text('Status', 170, yPos);
      doc.setTextColor(0, 0, 0);
      doc.setFont(undefined, 'normal');
      yPos += 7;

      portfolio.investments.slice(0, 20).forEach((inv, index) => {
        if (yPos > 280) {
          doc.addPage();
          yPos = 20;
          // Redraw header
          doc.setFillColor(17, 117, 197);
          doc.rect(14, yPos - 4, 182, 7, 'F');
          doc.setDrawColor(200, 200, 200);
          doc.rect(14, yPos - 4, 182, 7);
          doc.setTextColor(255, 255, 255);
          doc.setFontSize(9);
          doc.setFont(undefined, 'bold');
          doc.text('#', 18, yPos);
          doc.text('Property', 30, yPos);
          doc.text('Amount', 110, yPos);
          doc.text('Tokens', 150, yPos);
          doc.text('Status', 170, yPos);
          doc.setTextColor(0, 0, 0);
          doc.setFont(undefined, 'normal');
          yPos += 7;
        }

        const isAlternate = index % 2 === 1;
        if (isAlternate) {
          doc.setFillColor(245, 247, 250);
          doc.rect(14, yPos - 4, 182, 7, 'F');
        }
        doc.setDrawColor(200, 200, 200);
        doc.rect(14, yPos - 4, 182, 7);

        const propName = inv.property?.title || inv.propertyName || 'N/A';
        const amount = parseFloat(inv.amountInvestedUSDT || inv.amount || 0);
        const tokens = parseFloat(inv.tokensPurchased || inv.tokens || 0);
        const status = inv.status || 'active';

        doc.setFontSize(9);
        doc.text(String(index + 1), 18, yPos);
        doc.text(propName.substring(0, 25), 30, yPos);
        doc.text(`$${amount.toLocaleString()}`, 110, yPos);
        doc.text(tokens.toLocaleString(), 150, yPos);
        doc.text(status.toUpperCase().substring(0, 10), 170, yPos);
        
        yPos += 7;
      });

      if (portfolio.investments.length > 20) {
        doc.setFontSize(9);
        doc.setTextColor(100, 100, 100);
        doc.text(`... and ${portfolio.investments.length - 20} more investments`, 18, yPos);
        doc.setTextColor(0, 0, 0);
      }
      yPos += 5;
    }

    // Transactions Table
    if (transactions && transactions.length > 0) {
      if (yPos > 250) {
        doc.addPage();
        yPos = 20;
      }

      yPos = drawSectionHeader('Transaction History', yPos);
      yPos += 2;

      // Table Header
      doc.setFillColor(17, 117, 197);
      doc.rect(14, yPos - 4, 182, 7, 'F');
      doc.setDrawColor(200, 200, 200);
      doc.rect(14, yPos - 4, 182, 7);
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(9);
      doc.setFont(undefined, 'bold');
      doc.text('#', 18, yPos);
      doc.text('Date', 30, yPos);
      doc.text('Type', 80, yPos);
      doc.text('Amount', 120, yPos);
      doc.text('Status', 160, yPos);
      doc.setTextColor(0, 0, 0);
      doc.setFont(undefined, 'normal');
      yPos += 7;

      transactions.slice(0, 20).forEach((tx, index) => {
        if (yPos > 280) {
          doc.addPage();
          yPos = 20;
          // Redraw header
          doc.setFillColor(17, 117, 197);
          doc.rect(14, yPos - 4, 182, 7, 'F');
          doc.setDrawColor(200, 200, 200);
          doc.rect(14, yPos - 4, 182, 7);
          doc.setTextColor(255, 255, 255);
          doc.setFontSize(9);
          doc.setFont(undefined, 'bold');
          doc.text('#', 18, yPos);
          doc.text('Date', 30, yPos);
          doc.text('Type', 80, yPos);
          doc.text('Amount', 120, yPos);
          doc.text('Status', 160, yPos);
          doc.setTextColor(0, 0, 0);
          doc.setFont(undefined, 'normal');
          yPos += 7;
        }

        const isAlternate = index % 2 === 1;
        if (isAlternate) {
          doc.setFillColor(245, 247, 250);
          doc.rect(14, yPos - 4, 182, 7, 'F');
        }
        doc.setDrawColor(200, 200, 200);
        doc.rect(14, yPos - 4, 182, 7);

        const amount = parseFloat(tx.amountUSDT || tx.amount_in_pkr || tx.amount || 0);
        const type = tx.type || tx.transaction_type || 'N/A';
        const status = tx.status || 'N/A';
        const date = tx.createdAt || tx.date ? new Date(tx.createdAt || tx.date).toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: '2-digit' }) : 'N/A';

        doc.setFontSize(9);
        doc.text(String(index + 1), 18, yPos);
        doc.text(date, 30, yPos);
        doc.text(type.toUpperCase().substring(0, 12), 80, yPos);
        doc.text(`$${amount.toLocaleString()}`, 120, yPos);
        doc.text(status.toUpperCase().substring(0, 10), 160, yPos);
        
        yPos += 7;
      });

      if (transactions.length > 20) {
        doc.setFontSize(9);
        doc.setTextColor(100, 100, 100);
        doc.text(`... and ${transactions.length - 20} more transactions`, 18, yPos);
        doc.setTextColor(0, 0, 0);
      }
    }

    // Footer
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFillColor(240, 242, 247);
      doc.rect(14, 285, 182, 10, 'F');
      doc.setFontSize(8);
      doc.setTextColor(100, 100, 100);
      doc.text(`Page ${i} of ${pageCount}`, 105, 290, { align: 'center' });
      doc.text(`Generated on ${new Date().toLocaleDateString()}`, 105, 295, { align: 'center' });
    }

    doc.save(`User_Report_${user.displayCode || user.id}_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  const handleDownload = () => {
    if (reportType === 'property' && selectedProperty) {
      generatePropertyPDF();
    } else if (reportType === 'organization' && selectedOrganization) {
      generateOrganizationPDF();
    } else if (reportType === 'user' && selectedUser) {
      generateUserPDF();
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Please log in to view reports.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-card-foreground flex items-center gap-2">
            <FileText className="w-6 h-6" />
            Reports
          </h2>
          <p className="text-muted-foreground">
            Generate and download PDF reports for properties, organizations, or users
          </p>
        </div>
      </div>

      {/* Report Type Selection */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-card-foreground mb-4">Select Report Type</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            onClick={() => {
              setReportType('property');
              setSelectedProperty('');
              setSelectedOrganization('');
              setSelectedUser('');
            }}
            className={`p-6 border-2 rounded-lg transition-all ${
              reportType === 'property'
                ? 'border-primary bg-primary/10'
                : 'border-border hover:border-primary/50'
            }`}
          >
            <Building2 className={`w-8 h-8 mx-auto mb-3 ${reportType === 'property' ? 'text-primary' : 'text-muted-foreground'}`} />
            <h4 className="font-semibold text-card-foreground mb-1">Property Report</h4>
            <p className="text-sm text-muted-foreground">Generate detailed property analytics and investment data</p>
          </button>

          <button
            onClick={() => {
              setReportType('organization');
              setSelectedProperty('');
              setSelectedOrganization('');
              setSelectedUser('');
            }}
            className={`p-6 border-2 rounded-lg transition-all ${
              reportType === 'organization'
                ? 'border-primary bg-primary/10'
                : 'border-border hover:border-primary/50'
            }`}
          >
            <Folder className={`w-8 h-8 mx-auto mb-3 ${reportType === 'organization' ? 'text-primary' : 'text-muted-foreground'}`} />
            <h4 className="font-semibold text-card-foreground mb-1">Organization Report</h4>
            <p className="text-sm text-muted-foreground">View organization statistics and all related properties</p>
          </button>

          <button
            onClick={() => {
              setReportType('user');
              setSelectedProperty('');
              setSelectedOrganization('');
              setSelectedUser('');
            }}
            className={`p-6 border-2 rounded-lg transition-all ${
              reportType === 'user'
                ? 'border-primary bg-primary/10'
                : 'border-border hover:border-primary/50'
            }`}
          >
            <Users className={`w-8 h-8 mx-auto mb-3 ${reportType === 'user' ? 'text-primary' : 'text-muted-foreground'}`} />
            <h4 className="font-semibold text-card-foreground mb-1">User Report</h4>
            <p className="text-sm text-muted-foreground">Download comprehensive user portfolio and transaction data</p>
          </button>
        </div>
      </Card>

      {/* Selection and Download */}
      {reportType && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-card-foreground mb-4">Select {reportType === 'property' ? 'Property' : reportType === 'organization' ? 'Organization' : 'User'}</h3>
          
          {reportType === 'property' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Select Property
                </label>
                <select
                  value={selectedProperty}
                  onChange={(e) => setSelectedProperty(e.target.value)}
                  className="w-full px-4 py-2 border border-input rounded-lg bg-card text-card-foreground focus:ring-2 focus:ring-ring focus:border-ring"
                >
                  <option value="">Choose a property...</option>
                  {properties.map((property) => (
                    <option key={property.id || property.displayCode} value={property.id || property.displayCode}>
                      {property.title || property.name || 'N/A'} ({property.displayCode || property.id})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {reportType === 'organization' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Select Organization
                </label>
                <select
                  value={selectedOrganization}
                  onChange={(e) => setSelectedOrganization(e.target.value)}
                  className="w-full px-4 py-2 border border-input rounded-lg bg-card text-card-foreground focus:ring-2 focus:ring-ring focus:border-ring"
                >
                  <option value="">Choose an organization...</option>
                  {organizations.map((org) => (
                    <option key={org.id || org.displayCode} value={org.id || org.displayCode}>
                      {org.name || 'N/A'} ({org.displayCode || org.id})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {reportType === 'user' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Select User
                </label>
                <select
                  value={selectedUser}
                  onChange={(e) => setSelectedUser(e.target.value)}
                  className="w-full px-4 py-2 border border-input rounded-lg bg-card text-card-foreground focus:ring-2 focus:ring-ring focus:border-ring"
                >
                  <option value="">Choose a user...</option>
                  {users.map((user) => (
                    <option key={user.id || user.displayCode} value={user.id || user.displayCode}>
                      {user.fullName || user.name || 'N/A'} ({user.displayCode || user.id}) - {user.email}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          <div className="mt-6">
            <Button
              onClick={handleDownload}
              disabled={
                (reportType === 'property' && !selectedProperty) ||
                (reportType === 'organization' && !selectedOrganization) ||
                (reportType === 'user' && !selectedUser)
              }
              className="w-full flex items-center justify-center gap-2"
            >
              <FileDown className="w-5 h-5" />
              Download PDF Report
            </Button>
          </div>
        </Card>
      )}

      {/* Instructions */}
      {!reportType && (
        <Card className="p-6 bg-blue-50 border-blue-200">
          <div className="flex items-start gap-3">
            <FileText className="w-5 h-5 text-blue-600 mt-0.5" />
            <div>
              <h4 className="font-semibold text-blue-900 mb-2">How to Generate Reports</h4>
              <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
                <li>Select a report type above (Property, Organization, or User)</li>
                <li>Choose the specific entity from the dropdown</li>
                <li>Click "Download PDF Report" to generate and download the report</li>
                <li>Reports include comprehensive data, statistics, and transaction history</li>
              </ul>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};

export default ReportsManagement;

