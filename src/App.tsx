import { MantineProvider, createTheme } from '@mantine/core';
import Spreadsheet from "./spreadsheet";
import { Container, Stack } from '@mantine/core';
import { useForm } from "@mantine/form";
import { useEffect } from 'react';

const theme = createTheme({
  primaryColor: 'blue',
  defaultRadius: 'sm',
});

function Home() {
  const savedData = localStorage.getItem('spreadsheetData');
  const initialValues = savedData ? JSON.parse(savedData) : { sheet1: [], sheet2: [], sheet3: [], sheet4: [] };
  const form = useForm({
    mode: 'controlled',
    initialValues: initialValues,
    onValuesChange: (values) => {
      console.log(values);
      localStorage.setItem('spreadsheetData', JSON.stringify(values));
    }
  });
    
  return (
    <Container size="xl" py="xl">
      <Stack>

      <Spreadsheet 
        {...form.getInputProps('sheet1')} 
        rows={4} 
        cols={4} 
      />

      <Spreadsheet 
        {...form.getInputProps('sheet2')} 
        rows={['a','b','c','d','e']} 
        cols={4} 
      />

      <Spreadsheet 
        {...form.getInputProps('sheet3')} 
        rows={4} 
        cols={['a','b','c','d','e']} 
      />

      <Spreadsheet 
        {...form.getInputProps('sheet4')} 
        rows={['A','B','C','D','E']} 
        cols={['1','2','3','4','5']}
      />

      </Stack>

    </Container>
  );
}

function App() {
  return (
    <MantineProvider theme={theme}>
      <Home />
    </MantineProvider>
  );
}

export default App;