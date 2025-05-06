import mongoose from 'mongoose';
import Curriculo, { ICurriculo, IExperiencia, IProjeto } from '../Curriculo';
import User, { IUser, TipoUsuarioEnum } from '../User';
import logger from '../../config/logger';

// Mock dependencies
jest.mock('../../config/logger');

// Helper function to create a valid user for testing
const createTestUser = async (): Promise<mongoose.Document & IUser & { _id: mongoose.Types.ObjectId }> => {
  const user = new User({
    nome: 'Test Prestador',
    email: 'prestador@example.com',
    senha: 'Password123',
    telefone: '11987654321',
    cpfCnpj: '12345678901',
    tipoUsuario: TipoUsuarioEnum.PRESTADOR,
    endereco: 'Test Address',
    foto: 'test-photo.jpg'
  });

  await user.save();
  return user as mongoose.Document & IUser & { _id: mongoose.Types.ObjectId };
};

// Helper function to create valid curriculo data
const createValidCurriculoData = (prestadorId: mongoose.Types.ObjectId): {
  prestadorId: mongoose.Types.ObjectId;
  resumoProfissional: string;
  experiencias: IExperiencia[];
  habilidades: string[];
  projetos: IProjeto[];
} => ({
  prestadorId,
  resumoProfissional: 'Profissional com experiência em desenvolvimento de software',
  experiencias: [
    {
      cargo: 'Desenvolvedor Full Stack',
      empresa: 'Tech Company',
      periodoInicio: new Date('2020-01-01'),
      periodoFim: new Date('2022-01-01'),
      descricao: 'Desenvolvimento de aplicações web e mobile'
    }
  ],
  habilidades: ['JavaScript', 'TypeScript', 'React', 'Node.js'],
  projetos: [
    {
      nome: 'App de Serviços',
      descricao: 'Aplicativo para contratação de serviços',
      link: 'https://example.com/projeto',
      imagemUrl: 'https://example.com/imagem.jpg'
    }
  ]
});

describe('Curriculo Model', () => {
  // Connect to a test database before running tests
  beforeAll(async () => {
    // Use in-memory MongoDB server for testing
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/test-db');
  });

  // Clear the database between tests
  afterEach(async () => {
    jest.clearAllMocks();
    await Curriculo.deleteMany({});
    await User.deleteMany({});
  });

  // Disconnect from the database after all tests
  afterAll(async () => {
    await mongoose.connection.close();
  });

  describe('Schema Validation', () => {
    it('should create a curriculo with valid data', async () => {
      // Arrange
      const user = await createTestUser();
      const curriculoData = createValidCurriculoData(user._id);

      // Act
      const curriculo = new Curriculo(curriculoData);
      const savedCurriculo = await curriculo.save();

      // Assert
      expect(savedCurriculo._id).toBeDefined();
      expect(savedCurriculo.prestadorId.toString()).toBe(user._id.toString());
      expect(savedCurriculo.resumoProfissional).toBe(curriculoData.resumoProfissional);
      expect(savedCurriculo.experiencias).toHaveLength(1);
      expect(savedCurriculo.experiencias?.[0].cargo).toBe(curriculoData.experiencias[0].cargo);
      expect(savedCurriculo.habilidades).toHaveLength(4);
      expect(savedCurriculo.projetos).toHaveLength(1);
      expect(savedCurriculo.projetos?.[0].nome).toBe(curriculoData.projetos[0].nome);
      expect(savedCurriculo.createdAt).toBeDefined();
      expect(savedCurriculo.updatedAt).toBeDefined();
    });

    it('should require prestadorId field', async () => {
      // Arrange
      const user = await createTestUser();
      const { prestadorId, ...curriculoData } = createValidCurriculoData(user._id);

      // Act & Assert
      const curriculo = new Curriculo(curriculoData as any);
      await expect(curriculo.save()).rejects.toThrow(/prestadorId.*required/);
    });

    it('should enforce unique prestadorId constraint', async () => {
      // Arrange
      const user = await createTestUser();
      const curriculoData1 = createValidCurriculoData(user._id);
      const curriculoData2 = createValidCurriculoData(user._id); // Same prestadorId

      // Act & Assert
      await new Curriculo(curriculoData1).save();
      await expect(new Curriculo(curriculoData2).save()).rejects.toThrow(/duplicate key/);
    });

    it('should allow creating curriculo with only required fields', async () => {
      // Arrange
      const user = await createTestUser();
      const minimalCurriculoData = {
        prestadorId: user._id
      };

      // Act
      const curriculo = new Curriculo(minimalCurriculoData);
      const savedCurriculo = await curriculo.save();

      // Assert
      expect(savedCurriculo._id).toBeDefined();
      expect(savedCurriculo.prestadorId.toString()).toBe(user._id.toString());
      expect(savedCurriculo.resumoProfissional).toBeUndefined();
      expect(savedCurriculo.experiencias).toEqual([]);
      expect(savedCurriculo.habilidades).toEqual([]);
      expect(savedCurriculo.projetos).toBeUndefined();
    });
  });

  describe('Experiencia Subdocument', () => {
    it('should validate required fields in experiencia', async () => {
      // Arrange
      const user = await createTestUser();
      const curriculoData = createValidCurriculoData(user._id);

      // Missing required field 'cargo'
      const { cargo, ...invalidExperiencia } = curriculoData.experiencias[0];
      // Type assertion with partial type to allow missing required fields for testing
      curriculoData.experiencias = [invalidExperiencia as unknown as IExperiencia];

      // Act & Assert
      const curriculo = new Curriculo(curriculoData);
      await expect(curriculo.save()).rejects.toThrow(/cargo.*obrigatório/);
    });

    it('should validate required fields in experiencia - empresa', async () => {
      // Arrange
      const user = await createTestUser();
      const curriculoData = createValidCurriculoData(user._id);

      // Missing required field 'empresa'
      const { empresa, ...invalidExperiencia } = curriculoData.experiencias[0];
      // Type assertion with partial type to allow missing required fields for testing
      curriculoData.experiencias = [invalidExperiencia as unknown as IExperiencia];

      // Act & Assert
      const curriculo = new Curriculo(curriculoData);
      await expect(curriculo.save()).rejects.toThrow(/empresa.*obrigatória/);
    });

    it('should validate required fields in experiencia - periodoInicio', async () => {
      // Arrange
      const user = await createTestUser();
      const curriculoData = createValidCurriculoData(user._id);

      // Missing required field 'periodoInicio'
      const { periodoInicio, ...invalidExperiencia } = curriculoData.experiencias[0];
      // Type assertion with partial type to allow missing required fields for testing
      curriculoData.experiencias = [invalidExperiencia as unknown as IExperiencia];

      // Act & Assert
      const curriculo = new Curriculo(curriculoData);
      await expect(curriculo.save()).rejects.toThrow(/periodoInicio.*obrigatória/);
    });

    it('should allow optional fields in experiencia to be undefined', async () => {
      // Arrange
      const user = await createTestUser();
      const curriculoData = createValidCurriculoData(user._id);

      // Optional fields undefined
      const { periodoFim, descricao, ...validExperiencia } = curriculoData.experiencias[0];
      // Type assertion with partial type to allow missing optional fields for testing
      curriculoData.experiencias = [validExperiencia as unknown as IExperiencia];

      // Act
      const curriculo = new Curriculo(curriculoData);
      const savedCurriculo = await curriculo.save();

      // Assert
      expect(savedCurriculo.experiencias?.[0].periodoFim).toBeUndefined();
      expect(savedCurriculo.experiencias?.[0].descricao).toBeUndefined();
    });
  });

  describe('Projeto Subdocument', () => {
    it('should validate required fields in projeto', async () => {
      // Arrange
      const user = await createTestUser();
      const curriculoData = createValidCurriculoData(user._id);

      // Missing required field 'nome'
      const { nome, ...invalidProjeto } = curriculoData.projetos[0];
      // Type assertion with partial type to allow missing required fields for testing
      curriculoData.projetos = [invalidProjeto as unknown as IProjeto];

      // Act & Assert
      const curriculo = new Curriculo(curriculoData);
      await expect(curriculo.save()).rejects.toThrow(/nome.*obrigatório/);
    });

    it('should allow optional fields in projeto to be undefined', async () => {
      // Arrange
      const user = await createTestUser();
      const curriculoData = createValidCurriculoData(user._id);

      // Optional fields undefined
      const { descricao, link, imagemUrl, ...validProjeto } = curriculoData.projetos[0];
      // Type assertion with partial type to allow missing optional fields for testing
      curriculoData.projetos = [validProjeto as unknown as IProjeto];

      // Act
      const curriculo = new Curriculo(curriculoData);
      const savedCurriculo = await curriculo.save();

      // Assert
      expect(savedCurriculo.projetos?.[0].descricao).toBeUndefined();
      expect(savedCurriculo.projetos?.[0].link).toBeUndefined();
      expect(savedCurriculo.projetos?.[0].imagemUrl).toBeUndefined();
    });
  });

  describe('Habilidades Array', () => {
    it('should validate that habilidades contains non-empty strings', async () => {
      // Arrange
      const user = await createTestUser();
      const curriculoData = createValidCurriculoData(user._id);

      // Empty string in habilidades
      curriculoData.habilidades = ['JavaScript', '', 'React'];

      // Act & Assert
      const curriculo = new Curriculo(curriculoData);
      await expect(curriculo.save()).rejects.toThrow(/Habilidades não podem ser strings vazias/);
    });

    it('should allow habilidades to be undefined', async () => {
      // Arrange
      const user = await createTestUser();
      const curriculoData = createValidCurriculoData(user._id);

      // Habilidades undefined
      const curriculoDataWithoutHabilidades = {
        ...curriculoData,
        habilidades: undefined
      };

      // Act
      const curriculo = new Curriculo(curriculoDataWithoutHabilidades);
      const savedCurriculo = await curriculo.save();

      // Assert
      expect(savedCurriculo.habilidades).toEqual([]);
    });

    it('should allow habilidades to be an empty array', async () => {
      // Arrange
      const user = await createTestUser();
      const curriculoData = createValidCurriculoData(user._id);

      // Empty habilidades array
      curriculoData.habilidades = [];

      // Act
      const curriculo = new Curriculo(curriculoData);
      const savedCurriculo = await curriculo.save();

      // Assert
      expect(savedCurriculo.habilidades).toEqual([]);
    });
  });

  describe('Update Operations', () => {
    it('should allow updating resumoProfissional', async () => {
      // Arrange
      const user = await createTestUser();
      const curriculoData = createValidCurriculoData(user._id);
      const curriculo = new Curriculo(curriculoData);
      await curriculo.save();

      // Act
      const updatedResumoProfissional = 'Resumo profissional atualizado';
      curriculo.resumoProfissional = updatedResumoProfissional;
      await curriculo.save();

      // Assert
      const updatedCurriculo = await Curriculo.findById(curriculo._id);
      expect(updatedCurriculo?.resumoProfissional).toBe(updatedResumoProfissional);
    });

    it('should allow adding new experiencia', async () => {
      // Arrange
      const user = await createTestUser();
      const curriculoData = createValidCurriculoData(user._id);
      const curriculo = new Curriculo(curriculoData);
      await curriculo.save();

      // Act
      const newExperiencia: IExperiencia = {
        cargo: 'Desenvolvedor Senior',
        empresa: 'Nova Empresa',
        periodoInicio: new Date('2022-01-02'),
        periodoFim: new Date('2023-01-01'),
        descricao: 'Nova experiência profissional'
      };

      curriculo.experiencias?.push(newExperiencia);
      await curriculo.save();

      // Assert
      const updatedCurriculo = await Curriculo.findById(curriculo._id);
      expect(updatedCurriculo?.experiencias).toHaveLength(2);
      expect(updatedCurriculo?.experiencias?.[1].cargo).toBe(newExperiencia.cargo);
    });

    it('should allow adding new habilidades', async () => {
      // Arrange
      const user = await createTestUser();
      const curriculoData = createValidCurriculoData(user._id);
      const curriculo = new Curriculo(curriculoData);
      await curriculo.save();

      // Act
      const newHabilidade = 'MongoDB';
      curriculo.habilidades?.push(newHabilidade);
      await curriculo.save();

      // Assert
      const updatedCurriculo = await Curriculo.findById(curriculo._id);
      expect(updatedCurriculo?.habilidades).toHaveLength(5);
      expect(updatedCurriculo?.habilidades).toContain(newHabilidade);
    });
  });
});
