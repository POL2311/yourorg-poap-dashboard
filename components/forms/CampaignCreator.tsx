    try {
      // ✅ Fixed: Use correct data format matching the API
      await createCampaignMutation.mutateAsync({
        name: formData.name,
        description: formData.description || undefined,
        eventDate: new Date(formData.eventDate).toISOString(), // ✅ Convert to ISO string
        location: formData.location || undefined,
        imageUrl: formData.image || `https://api.dicebear.com/7.x/shapes/svg?seed=${encodeURIComponent(formData.name)}`,
        secretCode: formData.requireCode ? formData.secretCode : undefined,
        maxClaims: formData.maxSupply ? parseInt(formData.maxSupply) : undefined,
      })

      onSuccess()
      onClose()
    } catch (error) {
      console.error('Error creating campaign:', error)
      // Error handling is now done by the mutation hook
    }