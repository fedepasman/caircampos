/* eslint-disable */
// ╔══════════════════════════════════════════════════════════════════════════╗
// ║  ARCHIVO GENERADO — NO EDITAR A MANO                                     ║
// ║                                                                          ║
// ║  Regenerar con:  pnpm db:types                                           ║
// ║                                                                          ║
// ║  CI verifica que esté al día con `pnpm db:types:check` y falla si quedó   ║
// ║  desincronizado del esquema. Editarlo a mano hace que el tipado mienta    ║
// ║  sobre la forma real de la base, que es peor que no tener tipos.          ║
// ╚══════════════════════════════════════════════════════════════════════════╝

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  public: {
    Tables: {
      campos: {
        Row: {
          created_at: string;
          descripcion: string | null;
          hectareas: number;
          id: string;
          latitud: number;
          localidad: string;
          longitud: number;
          provincia: string;
          publicado: boolean;
          revisado_por_cair: string;
          socio_id: string;
          titulo: string;
          ubicacion: unknown;
        };
        Insert: {
          created_at?: string;
          descripcion?: string | null;
          hectareas: number;
          id?: string;
          latitud: number;
          localidad: string;
          longitud: number;
          provincia: string;
          publicado?: boolean;
          revisado_por_cair?: string;
          socio_id: string;
          titulo: string;
          ubicacion?: unknown;
        };
        Update: {
          created_at?: string;
          descripcion?: string | null;
          hectareas?: number;
          id?: string;
          latitud?: number;
          localidad?: string;
          longitud?: number;
          provincia?: string;
          publicado?: boolean;
          revisado_por_cair?: string;
          socio_id?: string;
          titulo?: string;
          ubicacion?: unknown;
        };
        Relationships: [
          {
            foreignKeyName: 'campos_socio_id_fkey';
            columns: ['socio_id'];
            isOneToOne: false;
            referencedRelation: 'socios';
            referencedColumns: ['id'];
          },
        ];
      };
      compradores: {
        Row: {
          apellido: string;
          created_at: string;
          id: string;
          nombre: string;
          telefono: string;
          usuario_id: string;
        };
        Insert: {
          apellido: string;
          created_at?: string;
          id?: string;
          nombre: string;
          telefono: string;
          usuario_id: string;
        };
        Update: {
          apellido?: string;
          created_at?: string;
          id?: string;
          nombre?: string;
          telefono?: string;
          usuario_id?: string;
        };
        Relationships: [];
      };
      consultas: {
        Row: {
          campo_id: string;
          comprador_id: string;
          created_at: string;
          id: string;
          mensaje: string | null;
        };
        Insert: {
          campo_id: string;
          comprador_id: string;
          created_at?: string;
          id?: string;
          mensaje?: string | null;
        };
        Update: {
          campo_id?: string;
          comprador_id?: string;
          created_at?: string;
          id?: string;
          mensaje?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'consultas_campo_id_fkey';
            columns: ['campo_id'];
            isOneToOne: false;
            referencedRelation: 'campos';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'consultas_comprador_id_fkey';
            columns: ['comprador_id'];
            isOneToOne: false;
            referencedRelation: 'compradores';
            referencedColumns: ['id'];
          },
        ];
      };
      socios: {
        Row: {
          created_at: string;
          id: string;
          nombre: string;
          usuario_id: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          nombre: string;
          usuario_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          nombre?: string;
          usuario_id?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      estadisticas_consultas_por_campo: {
        Args: never;
        Returns: {
          campo_id: string;
          cantidad_consultas: number;
          localidad: string;
          provincia: string;
          titulo: string;
        }[];
      };
      moderar_campo: {
        Args: { campo_id_a_moderar: string; nuevo_estado: string };
        Returns: undefined;
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, 'public'>];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    ? (DefaultSchema['Tables'] & DefaultSchema['Views'])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema['Tables'] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema['Tables'] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    keyof DefaultSchema['Enums'] | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums']
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums'][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema['Enums']
    ? DefaultSchema['Enums'][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    keyof DefaultSchema['CompositeTypes'] | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes']
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes'][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema['CompositeTypes']
    ? DefaultSchema['CompositeTypes'][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {},
  },
} as const;
