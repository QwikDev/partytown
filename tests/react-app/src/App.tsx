import React from 'react';
import logo from './logo.svg';
import './App.css';
import { Partytown } from '@qwik.dev/partytown/react';

function App() {
  return (
    <div className="App">
      <Partytown debug={true} />
      <script
        type="text/partytown"
        dangerouslySetInnerHTML={{
          __html: `
          console.log('Partytown script executed!!');
        `,
        }}
      />
      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
      </header>
    </div>
  );
}

export default App;
