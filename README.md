# EcoSpot ♻️

**EcoSpot** is a mobile application built with [React Native](https://reactnative.dev/) and [Expo](https://expo.dev/) that helps users locate nearby recycling points and learn about different types of waste. The app fetches real‑time data from a [Supabase](https://supabase.com/) database and provides an interactive map, list view, and category selector to make recycling easier.

_Esta versión del README está en español e inglés para que el proyecto sea accesible a una audiencia internacional._

## Features / Funcionalidades

* **Waste categories / Categoría de residuos** – a selector for different types of waste (envases, vidrio, papel y cartón, orgánico, etc.) to filter recycling points.
* **Interactive map / Mapa interactivo** – shows recycling points near the user’s current location using **react‑native‑maps** and Expo’s location permissions.
* **Recycling point list / Lista de puntos** – a detailed list with name, address, opening hours, phone number and container status. Includes buttons to call or open the location in Google Maps.
* **Login and logout / Inicio y cierre de sesión** – uses **Supabase Auth** to manage user sessions.
* **Responsive and accessible design / Diseño responsivo y accesible** with [Ionicons](https://ionic.io/ionicons) and distinctive colours for each waste type.

## Technologies / Tecnologías

* [React Native](https://reactnative.dev/)
* [Expo](https://expo.dev/)
* [React Navigation](https://reactnavigation.org/) (bottom‑tab navigator)
* [react‑native‑maps](https://github.com/react-native-maps/react-native-maps) (map)
* [Expo Location](https://docs.expo.dev/versions/latest/sdk/location/) (geolocation permissions)
* [Supabase](https://supabase.com/) (database and authentication)
* [Ionicons](https://ionic.io/ionicons) (icons)

## Installation / Instalación

### Requirements / Requisitos

* Node.js ≥ 14
* npm or [yarn](https://yarnpkg.com/)
* [Expo CLI](https://docs.expo.dev/get-started/installation/)
* A **Supabase** account with a database configured to include the tables `tiporesiduo`, `puntoreciclaje` and `punto_residuo`.

### Steps / Pasos

1. **Clone this repository / Clona este repositorio**:

   ```bash
   git clone https://github.com/Sangaarr/EcoSpot.git
   cd EcoSpot
2. **Install dependencies / Instala las dependencias**:

   ```bash
   npm install
   # o
   yarn install
3. **Configure Supabase / Configura Supabase**:

   This project expects a file `src/utils/supabaseClient.js` exporting your Supabase client.  
   Replace the placeholder values with your Supabase **URL** and **anon key**:

   ```js
   import { createClient } from '@supabase/supabase-js';

   const supabaseUrl = 'https://YOUR_PROJECT.supabase.co';
   const supabaseAnonKey = 'YOUR_SUPABASE_ANON_KEY';

   export const supabase = createClient(supabaseUrl, supabaseAnonKey);
   ```

   - Make sure the Supabase database has the necessary tables and relationships.
   - You can find example schemas in the `import_data.js` file.
4. **Start the app / Inicia la aplicación**:

   Start the Expo development server. You can run the app on an emulator, simulator,  
   or on a physical device using the Expo Go app.

   ```bash
   npm start
   # o
   yarn start
   ```

   After starting the server:
   - Open the app in an Android emulator or iOS simulator.
   - Or scan the QR code with the **Expo Go** app on your mobile device.
## Usage / Uso

- When launching the app for the first time, you will be prompted to grant **location permissions**.
  - If permission is denied, the app will display a **default location (Madrid)**.

- Select a **waste category / categoría de residuo** in the *Residuos* tab to filter the recycling points shown.

- In the **Mapa** tab:
  - You can view nearby recycling points on an interactive map.

- In the **Ver Lista** tab:
  - You will see a detailed list of recycling points with address, opening hours and contact information.
  - Tap **“Cómo llegar”** to open directions in Google Maps.
  - Tap the phone number to call directly.

- Use the **Salir** tab to log out from the application (Supabase session).
## Project Structure / Estructura del proyecto

```
EcoSpot/
├─ src/
│  ├─ components/         # React Native components (WasteSelector, SearchMap, RecyclingPointList, AuthScreen)
│  ├─ utils/              # Supabase client configuration (supabaseClient.js)
│  └─ ...                 # Other helper modules and screens
├─ assets/                # Images, icons and other static assets
├─ App.js                 # Root component with bottom-tab navigation
├─ import_data.js         # Script to import sample data into Supabase
├─ package.json           # Project dependencies and scripts
└─ README.md              # Project documentation
```
## Contributing / Contribuir

Contributions, suggestions and bug reports are welcome!

1. Fork this repository and create your branch from `main`.
2. Create a new branch for your feature or fix:
   ```
   git checkout -b feature/your-feature-name
   ```
3. Make your changes and commit them with clear, descriptive messages:
   ```
   git commit -m "Add new feature"
   ```
4. Push your branch to your fork:
   ```
   git push origin feature/your-feature-name
   ```
5. Open a Pull Request and describe the changes you have made.

Please make sure your code follows good practices and is properly tested before submitting a pull request.
## License / Licencia

This project is licensed under the **MIT License**.

Create a file called `LICENSE` in the root of the repository with the following content:

```
MIT License

Copyright (c) 2026 Enrique Sánchez

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```
## Acknowledgements / Agradecimientos

This project was developed as a personal and educational initiative to promote recycling awareness and sustainable habits through technology.

Special thanks to:
- The **open-source community** for the libraries and tools used in this project.
- The teams behind **React Native**, **Expo** and **Supabase** for providing excellent documentation and developer experience.
- All contributors and testers who provided feedback and suggestions during development.
## Screenshots / Capturas de pantalla

Below are some screenshots of the application to showcase its main features and user interface.

<table>
  <tr>
    <td align="center"><strong>Home screen</strong></td>
    <td align="center"><strong>Waste selector</strong></td>
    <td align="center"><strong>Map screen</strong></td>
    <td align="center"><strong>Recycling points list</strong></td>
  </tr>
  <tr>
    <td align="center">
      <img width="300" alt="Login" src="https://github.com/user-attachments/assets/a8215d50-a99c-4c10-9e5b-116f4474c3a3" />
    </td>
    <td align="center">
      <img width="300" alt="WasteSelector" src="https://github.com/user-attachments/assets/37527731-a2b3-4ce6-93c5-6d4026b2805d" />
    </td>
    <td align="center">
      <img width="300" alt="Mapa" src="https://github.com/user-attachments/assets/e58d219e-c8b3-4c21-85d9-c850b15dd64a" />
    </td>
    <td align="center">
      <img width="300" alt="Lista" src="https://github.com/user-attachments/assets/94196eb4-0e0c-4858-acfb-e57c5efc281c" />
    </td>
  </tr>
</table>

You can also include GIFs to better demonstrate interactions or flows within the app.
