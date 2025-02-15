const test = require('ava')
const middy = require('../../core/index.js')
const s3KeyNormalizer = require('../index.js')

test('It normalizes keys in a s3 PUT event', async (t) => {
  const event = {
    Records: [
      {
        eventVersion: '2.1',
        eventTime: '1970-01-01T00:00:00.000Z',
        requestParameters: {
          sourceIPAddress: '127.0.0.1'
        },
        s3: {
          configurationId: 'testConfigRule',
          object: {
            eTag: '0123456789abcdef0123456789abcdef',
            sequencer: '0A1B2C3D4E5F678901',
            key: 'This+is+a+picture.jpg',
            size: 1024
          },
          bucket: {
            arn: 'arn:aws:s3:::mybucket',
            name: 'sourcebucket',
            ownerIdentity: {
              principalId: 'EXAMPLE'
            }
          },
          s3SchemaVersion: '1.0'
        },
        responseElements: {
          'x-amz-id-2':
            'EXAMPLE123/5678abcdefghijklambdaisawesome/mnopqrstuvwxyzABCDEFGH',
          'x-amz-request-id': 'EXAMPLE123456789'
        },
        awsRegion: 'us-east-1',
        eventName: 'ObjectCreated:Put',
        userIdentity: {
          principalId: 'EXAMPLE'
        },
        eventSource: 'aws:s3'
      }
    ]
  }

  const handler = middy((event, context) => event)

  handler.use(s3KeyNormalizer())

  const response = await handler(event)

  t.is(response.Records[0].s3.object.key, 'This is a picture.jpg')
})

test('It normalizes keys in a s3 DELETE event', async (t) => {
  const event = {
    Records: [
      {
        eventVersion: '2.1',
        eventTime: '1970-01-01T00:00:00.000Z',
        requestParameters: {
          sourceIPAddress: '127.0.0.1'
        },
        s3: {
          configurationId: 'testConfigRule',
          object: {
            sequencer: '0A1B2C3D4E5F678901',
            key: 'This+is+a+picture.jpg'
          },
          bucket: {
            arn: 'arn:aws:s3:::mybucket',
            name: 'sourcebucket',
            ownerIdentity: {
              principalId: 'EXAMPLE'
            }
          },
          s3SchemaVersion: '1.0'
        },
        responseElements: {
          'x-amz-id-2':
            'EXAMPLE123/5678abcdefghijklambdaisawesome/mnopqrstuvwxyzABCDEFGH',
          'x-amz-request-id': 'EXAMPLE123456789'
        },
        awsRegion: 'us-east-1',
        eventName: 'ObjectRemoved:Delete',
        userIdentity: {
          principalId: 'EXAMPLE'
        },
        eventSource: 'aws:s3'
      }
    ]
  }

  const handler = middy((event, context) => event)

  handler.use(s3KeyNormalizer())

  const response = await handler(event)

  t.is(response.Records[0].s3.object.key, 'This is a picture.jpg')
})

test('It should normalize the event if the event version is 2.x', async (t) => {
  const event = {
    Records: [
      {
        eventVersion: '2.3',
        eventTime: '1970-01-01T00:00:00.000Z',
        requestParameters: {
          sourceIPAddress: '127.0.0.1'
        },
        s3: {
          configurationId: 'testConfigRule',
          object: {
            sequencer: '0A1B2C3D4E5F678901',
            key: 'This+is+a+picture.jpg'
          },
          bucket: {
            arn: 'arn:aws:s3:::mybucket',
            name: 'sourcebucket',
            ownerIdentity: {
              principalId: 'EXAMPLE'
            }
          },
          s3SchemaVersion: '1.0'
        },
        responseElements: {
          'x-amz-id-2':
            'EXAMPLE123/5678abcdefghijklambdaisawesome/mnopqrstuvwxyzABCDEFGH',
          'x-amz-request-id': 'EXAMPLE123456789'
        },
        awsRegion: 'us-east-1',
        eventName: 'ObjectRemoved:Delete',
        userIdentity: {
          principalId: 'EXAMPLE'
        },
        eventSource: 'aws:s3'
      }
    ]
  }

  const handler = middy((event, context) => event)

  handler.use(s3KeyNormalizer())

  const response = await handler(event)

  t.is(response.Records[0].s3.object.key, 'This is a picture.jpg')
})

test("It should not normalize the event if it doesn't look like an S3 event", async (t) => {
  const alexaEvent = {
    header: {
      payloadVersion: '2',
      namespace: 'Alexa.ConnectedHome.Discovery',
      name: 'DiscoverAppliancesRequest',
      messageId: 'F8752B11-69BB-4246-B923-3BFB27C06C7D'
    },
    payload: {
      accessToken: '1'
    }
  }

  const eventOriginalCopy = Object.assign({}, alexaEvent)

  const handler = middy((event, context) => event)

  handler.use(s3KeyNormalizer())

  const response = await handler(alexaEvent)

  // checks if the event is still equal to its original copy
  t.deepEqual(response, eventOriginalCopy)
})

test("It should not normalize the event if the S3 event doesn't match the expected format", async (t) => {
  const event = {
    Records: [
      {
        eventVersion: '3.0',
        eventTime: '1970-01-01T00:00:00.000Z',
        requestParameters: {
          sourceIPAddress: '127.0.0.1'
        },
        s3: {
          configurationId: 'testConfigRule',
          object: {
            eTag: '0123456789abcdef0123456789abcdef',
            sequencer: '0A1B2C3D4E5F678901',
            key: 'This+is+a+picture.jpg',
            size: 1024
          },
          bucket: {
            arn: 'arn:aws:s3:::mybucket',
            name: 'sourcebucket',
            ownerIdentity: {
              principalId: 'EXAMPLE'
            }
          },
          s3SchemaVersion: '1.0'
        },
        responseElements: {
          'x-amz-id-2':
            'EXAMPLE123/5678abcdefghijklambdaisawesome/mnopqrstuvwxyzABCDEFGH',
          'x-amz-request-id': 'EXAMPLE123456789'
        },
        awsRegion: 'us-east-1',
        eventName: 'ObjectCreated:Put',
        userIdentity: {
          principalId: 'EXAMPLE'
        },
        eventSource: 'aws:s3'
      }
    ]
  }

  const eventOriginalCopy = { ...event }

  const handler = middy((event, context) => event)

  handler.use(s3KeyNormalizer())

  const response = await handler(event)

  // checks if the event is still equal to its original copy
  t.deepEqual(response, eventOriginalCopy)
})
