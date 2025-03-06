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
      val: [] as string[][],
    },
    onValuesChange: (values) => {
      console.log(values);
    }
  });
  return (
    <Container size="xl" py="xl">
      <Spreadsheet {...form.getInputProps('val')} rows={5} cols={5} />
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