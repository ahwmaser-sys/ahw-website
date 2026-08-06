import React from 'react';
import { Html, Head, Body, Container, Section, Text, Heading, Hr, Preview } from '@react-email/components';

// Deliberately styled to match InternalNotification.tsx (the contact
// form's equivalent) rather than a second design language for email.
interface CareersNotificationProps {
  fullName: string;
  email: string;
  phone: string;
  country: string;
  city: string;
  position: string;
  department: string;
  preferredOffice: string;
  experience: string;
  currentEmployer?: string;
  portfolioUrl?: string;
  linkedinUrl?: string;
  coverLetter?: string;
  cvFileName: string;
}

export function CareersNotificationEmail({
  fullName,
  email,
  phone,
  country,
  city,
  position,
  department,
  preferredOffice,
  experience,
  currentEmployer,
  portfolioUrl,
  linkedinUrl,
  coverLetter,
  cvFileName,
}: CareersNotificationProps) {
  return (
    <Html>
      <Head />
      <Preview>New Application: {position} — {fullName}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>AHW Architects | New Job Application</Heading>
          <Text style={text}>
            A new application was submitted for <strong>{position}</strong> ({department}), preferred office: <strong>{preferredOffice}</strong>.
          </Text>

          <Hr style={hr} />

          <Section>
            <Heading as="h2" style={h2}>Applicant</Heading>
            <Text style={text}><strong>Name:</strong> {fullName}</Text>
            <Text style={text}><strong>Email:</strong> {email}</Text>
            <Text style={text}><strong>Phone:</strong> {phone}</Text>
            <Text style={text}><strong>Location:</strong> {city}, {country}</Text>
            <Text style={text}><strong>Experience:</strong> {experience}</Text>
            {currentEmployer && <Text style={text}><strong>Current employer:</strong> {currentEmployer}</Text>}
            {portfolioUrl && <Text style={text}><strong>Portfolio:</strong> {portfolioUrl}</Text>}
            {linkedinUrl && <Text style={text}><strong>LinkedIn:</strong> {linkedinUrl}</Text>}
          </Section>

          <Hr style={hr} />

          <Section>
            <Heading as="h2" style={h2}>CV</Heading>
            <Text style={text}>Attached to this email: {cvFileName}</Text>
          </Section>

          {coverLetter && (
            <>
              <Hr style={hr} />
              <Section>
                <Heading as="h2" style={h2}>Cover letter</Heading>
                <Text style={messageBox}>{coverLetter}</Text>
              </Section>
            </>
          )}
        </Container>
      </Body>
    </Html>
  );
}

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
