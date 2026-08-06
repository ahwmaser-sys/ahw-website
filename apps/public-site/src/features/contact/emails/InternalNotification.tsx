import React from 'react';
import {
  Html,
  Head,
  Body,
  Container,
  Section,
  Text,
  Heading,
  Hr,
  Preview,
} from '@react-email/components';

interface InternalNotificationProps {
  name: string;
  company?: string;
  email: string;
  phone: string;
  country: string;
  projectType: string;
  budget?: string;
  timeline: string;
  message: string;
  officeName: string;
}

export function InternalNotificationEmail({
  name,
  company,
  email,
  phone,
  country,
  projectType,
  budget,
  timeline,
  message,
  officeName,
}: InternalNotificationProps) {
  return (
    <Html>
      <Head />
      <Preview>New Lead: {projectType} Inquiry from {name}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>AHW Architects | New Inquiry</Heading>
          <Text style={text}>
            You have received a new inquiry routed to the <strong>{officeName}</strong>.
          </Text>
          
          <Hr style={hr} />
          
          <Section>
            <Heading as="h2" style={h2}>Client Details</Heading>
            <Text style={text}><strong>Name:</strong> {name}</Text>
            {company && <Text style={text}><strong>Company:</strong> {company}</Text>}
            <Text style={text}><strong>Email:</strong> {email}</Text>
            <Text style={text}><strong>Phone:</strong> {phone}</Text>
            <Text style={text}><strong>Country:</strong> {country}</Text>
          </Section>

          <Hr style={hr} />

          <Section>
            <Heading as="h2" style={h2}>Project Details</Heading>
            <Text style={text}><strong>Project Type:</strong> {projectType}</Text>
            <Text style={text}><strong>Timeline:</strong> {timeline}</Text>
            {budget && <Text style={text}><strong>Estimated Budget:</strong> {budget}</Text>}
          </Section>

          <Hr style={hr} />

          <Section>
            <Heading as="h2" style={h2}>Message</Heading>
            <Text style={messageBox}>{message}</Text>
          </Section>

        </Container>
      </Body>
    </Html>
  );
}

// Styles
const main = {
  backgroundColor: '#f6f9fc',
  fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
};

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  padding: '40px',
  marginBottom: '64px',
  border: '1px solid #eee',
  borderRadius: '5px',
};

const h1 = {
  color: '#0f1115',
  fontSize: '24px',
  fontWeight: '300',
  letterSpacing: '-0.5px',
  margin: '0 0 20px',
};

const h2 = {
  color: '#444',
  fontSize: '16px',
  fontWeight: '600',
  textTransform: 'uppercase' as const,
  letterSpacing: '1px',
  margin: '0 0 16px',
};

const text = {
  color: '#333',
  fontSize: '15px',
  lineHeight: '24px',
  margin: '0 0 8px',
};

const messageBox = {
  backgroundColor: '#f9f9f9',
  padding: '16px',
  borderRadius: '4px',
  fontSize: '15px',
  lineHeight: '26px',
  color: '#333',
  fontStyle: 'italic',
};

const hr = {
  borderColor: '#e6ebf1',
  margin: '30px 0',
};
