// RADIUS Customer Status endpoint to be added to server/routes.ts
// Add this code after the other RADIUS endpoints in the routes.ts file

// RADIUS Customer Status
app.get('/api/radius/customers/:id', authenticate, async (req, res) => {
  try {
    const customerId = parseInt(req.params.id);
    
    // Get customer
    const customer = await storage.getCustomer(customerId);
    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }
    
    // Get recent authentication attempts
    const recentAuths = await storage.getRadiusAuthsByUsername(customer.username, 5);
    
    // Check if customer has any active sessions
    const isOnline = recentAuths.some(auth => 
      auth.status === 'accept' && 
      new Date().getTime() - new Date(auth.timestamp).getTime() < 3600000 // within last hour
    );
    
    // Get the most recent session
    const lastSession = recentAuths.length > 0 ? recentAuths[0].timestamp : null;
    
    // Get this month's usage
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);
    
    const endOfMonth = new Date();
    
    const monthUsages = await storage.getCustomerUsageByDateRange(
      customerId,
      startOfMonth,
      endOfMonth
    );
    
    // Calculate total usage
    const totalDownload = monthUsages.reduce((sum, usage) => sum + usage.downloadUsage, 0);
    const totalUpload = monthUsages.reduce((sum, usage) => sum + usage.uploadUsage, 0);
    
    res.json({
      online: isOnline,
      lastSession,
      recentAuths,
      usageThisMonth: {
        download: parseFloat(totalDownload.toFixed(2)),
        upload: parseFloat(totalUpload.toFixed(2)),
        total: parseFloat((totalDownload + totalUpload).toFixed(2))
      }
    });
  } catch (error) {
    console.error('Error retrieving RADIUS customer status:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});