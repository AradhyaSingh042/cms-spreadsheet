import { MantineProvider, createTheme } from '@mantine/core';
import Spreadsheet from "./spreadsheet";
import { Container } from '@mantine/core';
import { useForm } from "@mantine/form";

const theme = createTheme({
  primaryColor: 'blue',
  defaultRadius: 'sm',
});

function Home() {
  const form = useForm({
    mode: 'controlled',
    initialValues: {
      val: [[],["1","2","3","4","5"]] as string[][],
    },
    onValuesChange: (values) => {
      console.log(values);
    }
  });
  return (
    <Container size="xl" py="xl">
      <Spreadsheet 
        {...form.getInputProps('val')} 
        rows={['1', '2', '3', '4', '5', '6', '7', '8', '9', '10']} 
        cols={['apple','banana']} 
      />
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