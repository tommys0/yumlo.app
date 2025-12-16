// Debug script to test session API
require('dotenv').config({ path: '.env.local' });

async function testSessionAPI() {
  try {
    console.log('🔧 Testing session API...');

    // Create a session
    console.log('\n1. Creating session...');
    const createResponse = await fetch('http://localhost:3000/api/session/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });

    if (!createResponse.ok) {
      throw new Error(`Create failed: ${createResponse.status}`);
    }

    const { sessionId } = await createResponse.json();
    console.log('✅ Session created:', sessionId);

    // Add a test photo
    console.log('\n2. Adding test photo...');
    const testPhoto = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/2wBDAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwA/8A8A=='; // Tiny 1x1 test image

    const addResponse = await fetch(`http://localhost:3000/api/session/${sessionId}/photos`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ photo: testPhoto })
    });

    if (!addResponse.ok) {
      throw new Error(`Add photo failed: ${addResponse.status}`);
    }

    const addResult = await addResponse.json();
    console.log('✅ Photo added:', addResult);

    // Get photos back
    console.log('\n3. Getting photos...');
    const getResponse = await fetch(`http://localhost:3000/api/session/${sessionId}/photos`);

    if (!getResponse.ok) {
      throw new Error(`Get photos failed: ${getResponse.status}`);
    }

    const getResult = await getResponse.json();
    console.log('📸 Photos returned:', {
      photoCount: getResult.photoCount,
      status: getResult.status,
      photosLength: getResult.photos?.length,
      hasPhotos: Array.isArray(getResult.photos) && getResult.photos.length > 0
    });

    if (getResult.photos?.length > 0) {
      console.log('✅ Photos detected correctly!');
    } else {
      console.log('❌ No photos returned - this is the issue!');
    }

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testSessionAPI();